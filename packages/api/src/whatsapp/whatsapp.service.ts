import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { LeadsService } from '../leads/leads.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class WhatsappService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leads: LeadsService,
    private readonly events: EventsService,
  ) {}

  verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      return challenge;
    }
    return null;
  }

  async handleWebhook(body: unknown, userId: string) {
    const entries = (body as Record<string, unknown[]>)?.entry || [];

    for (const entry of entries) {
      const changes = (entry as Record<string, unknown[]>)?.changes || [];
      for (const change of changes as Array<Record<string, unknown>>) {
        if (change.field === 'messages') {
          const value = change.value as Record<string, unknown[]>;
          const messages = value?.messages || [];
          for (const msg of messages) {
            await this.processIncomingMessage(msg as Record<string, unknown>, userId);
          }
        }
      }
    }
  }

  private async processIncomingMessage(msg: Record<string, unknown>, userId: string) {
    const phone = msg.from as string;
    const messageBody = (msg.text as Record<string, string>)?.body || '';

    // Try to extract click_id from message (format: ref:ck_XXXXXXX)
    const clickIdMatch = messageBody.match(/ref:(ck_[A-Za-z0-9]{7})/);
    const clickId = clickIdMatch?.[1];

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

    const lead = await this.leads.findOrCreate(userId, phone, leadData);

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
        content: messageBody || (msg.type as string) || '',
        type: (msg.type as string) || 'text',
        direction: 'inbound',
        status: 'received',
        whatsappMsgId: msg.id as string,
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

  async sendMessage(userId: string, conversationId: string, content: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: { lead: true },
    });

    if (!conversation) throw new Error('Conversation not found');

    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    const response = await fetch(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: conversation.lead.phone,
          type: 'text',
          text: { body: content },
        }),
      },
    );

    const result = await response.json();

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        content,
        type: 'text',
        direction: 'outbound',
        status: response.ok ? 'sent' : 'failed',
        whatsappMsgId: result?.messages?.[0]?.id || null,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
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
            campaign: { select: { name: true, creativeName: true } },
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
    const conversation = await this.getConversation(userId, conversationId);

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
