import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { LeadsService } from '../leads/leads.service';
import { EventsService } from '../events/events.service';

interface ZApiIncomingMessage {
  phone?: string;
  fromMe?: boolean;
  messageId?: string;
  momment?: number;
  status?: string;
  chatName?: string;
  senderName?: string;
  isGroup?: boolean;
  text?: { message?: string };
  image?: { imageUrl?: string; caption?: string; mimeType?: string };
  audio?: { audioUrl?: string; mimeType?: string };
  document?: { documentUrl?: string; fileName?: string; mimeType?: string };
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly leads: LeadsService,
    private readonly events: EventsService,
  ) {}

  // Story 3.1: Handle Z-API webhook payload
  async handleZApiWebhook(body: unknown, userId: string) {
    const msg = body as ZApiIncomingMessage;

    // AC4: Discard fromMe messages (already saved on send, avoids duplication)
    if (msg.fromMe === true) return;

    // Ignore group messages
    if (msg.isGroup === true) return;

    if (!msg.phone) return;

    await this.processIncomingMessage(msg, userId);
  }

  // Story 3.2: Handle delivery status updates
  async handleDeliveryStatus(body: unknown) {
    const payload = body as { messageId?: string; status?: string };
    if (!payload.messageId || !payload.status) return;

    const statusMap: Record<string, string> = {
      SENT: 'sent',
      RECEIVED: 'delivered',
      READ: 'read',
      PLAYED: 'read',
    };

    const mappedStatus = statusMap[payload.status];
    if (!mappedStatus) return;

    await this.prisma.message.updateMany({
      where: { whatsappMsgId: payload.messageId },
      data: { status: mappedStatus },
    });
  }

  private async processIncomingMessage(msg: ZApiIncomingMessage, userId: string) {
    const phone = msg.phone!;

    // Determine message content and type from Z-API payload
    let content = '';
    let type = 'text';
    let mediaUrl: string | null = null;
    let fileName: string | null = null;

    if (msg.text?.message) {
      content = msg.text.message;
      type = 'text';
    } else if (msg.image?.imageUrl) {
      content = msg.image.caption || '';
      type = 'image';
      mediaUrl = msg.image.imageUrl;
    } else if (msg.audio?.audioUrl) {
      type = 'audio';
      mediaUrl = msg.audio.audioUrl;
    } else if (msg.document?.documentUrl) {
      type = 'document';
      mediaUrl = msg.document.documentUrl;
      fileName = msg.document.fileName || null;
    }

    // Extract click_id — try visible format first, then zero-width encoded
    let clickId: string | undefined;

    // 1. Try visible format (legacy): ref:ck_XXXXXXX
    const visibleMatch = content.match(/ref:(ck_[A-Za-z0-9]{7})/);
    if (visibleMatch) {
      clickId = visibleMatch[1];
    } else {
      // 2. Try zero-width encoded format: decode \u2060\u2060...\u2060\u2060 block
      const zwDecode = (text: string): string | null => {
        const markerStart = text.indexOf('\u2060\u2060');
        if (markerStart === -1) return null;
        const afterStart = markerStart + 2;
        const markerEnd = text.indexOf('\u2060\u2060', afterStart);
        if (markerEnd === -1) return null;
        const encoded = text.substring(afterStart, markerEnd);
        const chars = encoded.split('\u200D');
        return chars.map(bits => {
          const binary = bits.split('').map(b => b === '\u200B' ? '0' : '1').join('');
          return String.fromCharCode(parseInt(binary, 2));
        }).join('');
      };
      const decoded = zwDecode(content);
      if (decoded) {
        const match = decoded.match(/ref:(ck_[A-Za-z0-9]{7})/);
        clickId = match?.[1];
      }
    }

    let leadData: Record<string, string | undefined> = {};
    if (clickId) {
      const click = await this.prisma.click.findUnique({
        where: { clickId },
        include: { campaign: true },
      });
      if (click) {
        leadData = {
          campaignId: click.campaignId,
          productId: click.campaign.productId,
          clickId: click.id,
          fbclid: click.fbclid || undefined,
        };
      }
    }

    const lead = await this.leads.findOrCreate(userId, phone, {
      ...leadData,
      name: msg.senderName || msg.chatName || undefined,
    });

    // Update lead status to contacted
    if (lead.status === 'new') {
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: { status: 'contacted' },
      });
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { leadId: lead.id, userId },
    });

    const isFirstMessage = !conversation;

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { leadId: lead.id, userId },
      });
    }

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: content || type,
        type,
        direction: 'inbound',
        status: 'received',
        whatsappMsgId: msg.messageId || null,
        mediaUrl,
        fileName,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        unreadCount: { increment: 1 },
      },
    });

    // FR3: Auto-fire ViewContent on first message from matched lead
    if (isFirstMessage) {
      await this.events.fireViewContentIfFirst(lead.id, conversation.id, userId);
    }
  }

  // Story 3.2: Send message via Z-API (text, image, audio, document)
  async sendMessage(
    userId: string,
    conversationId: string,
    opts: { content: string; type?: string; mediaUrl?: string; fileName?: string },
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { lead: true },
    });

    if (!conversation) throw new Error('Conversation not found');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { zapiInstanceId: true, zapiToken: true, zapiClientToken: true },
    });

    if (!user?.zapiInstanceId || !user?.zapiToken || !user?.zapiClientToken) {
      throw new Error('WhatsApp não configurado. Vá em Settings > WhatsApp.');
    }

    const token = this.crypto.decrypt(user.zapiToken);
    const clientToken = this.crypto.decrypt(user.zapiClientToken);
    const baseApiUrl = `https://api.z-api.io/instances/${user.zapiInstanceId}/token/${token}`;
    const headers = { 'Client-Token': clientToken, 'Content-Type': 'application/json' };
    const phone = conversation.lead.phone;
    const type = opts.type || 'text';

    let endpoint: string;
    let body: Record<string, unknown>;

    switch (type) {
      case 'image':
        endpoint = `${baseApiUrl}/send-image`;
        body = { phone, image: opts.mediaUrl, caption: opts.content || '' };
        break;
      case 'audio':
        endpoint = `${baseApiUrl}/send-audio`;
        body = { phone, audio: opts.mediaUrl };
        break;
      case 'document':
        endpoint = `${baseApiUrl}/send-document`;
        body = { phone, document: opts.mediaUrl, fileName: opts.fileName || 'file' };
        break;
      default:
        endpoint = `${baseApiUrl}/send-text`;
        body = { phone, message: opts.content };
        break;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as { zaapId?: string; messageId?: string };

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content: opts.content || type,
        type,
        direction: 'outbound',
        status: response.ok ? 'sent' : 'failed',
        whatsappMsgId: result?.messageId || null,
        zaapId: result?.zaapId || null,
        mediaUrl: opts.mediaUrl || null,
        fileName: opts.fileName || null,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  async deleteConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error('Conversation not found');

    // Delete messages, events, orders linked to this conversation, then the conversation
    await this.prisma.message.deleteMany({ where: { conversationId } });
    await this.prisma.order.deleteMany({ where: { conversationId } });
    await this.prisma.event.deleteMany({ where: { conversationId } });
    await this.prisma.conversation.delete({ where: { id: conversationId } });

    return { deleted: true };
  }

  async getConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      include: {
        lead: {
          select: {
            phone: true,
            name: true,
            status: true,
            product: { select: { name: true } },
            campaign: { select: { name: true } },
          },
        },
        messages: { take: 1, orderBy: { createdAt: 'desc' } },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });
    if (!conversation) throw new Error('Conversation not found');
    return conversation;
  }

  async getMessages(userId: string, conversationId: string) {
    await this.getConversation(userId, conversationId);

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
