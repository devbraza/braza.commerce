import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Req,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WhatsappService } from './whatsapp.service';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhookSignatureGuard } from '../common/guards/webhook-signature.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationEventDto } from './dto/create-conversation-event.dto';

@Controller()
export class WhatsappController {
  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly eventsService: EventsService,
  ) {}

  // Webhook verification (no auth)
  @Get('webhook/whatsapp')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.whatsappService.verifyWebhook(mode, token, challenge);
    if (result) {
      res.status(200).send(result);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  // FIX-001: Webhook connected to service
  // FIX-003: Signature validation via guard
  @Post('webhook/whatsapp')
  @UseGuards(WebhookSignatureGuard)
  async handleWebhook(@Body() body: unknown, @Res() res: Response) {
    // Respond immediately to Meta (required within 5 seconds)
    res.status(200).send('EVENT_RECEIVED');

    // Process asynchronously — v1 single-tenant uses DEFAULT_USER_ID
    const userId = process.env.DEFAULT_USER_ID;
    if (userId) {
      await this.whatsappService.handleWebhook(body, userId);
    }
  }

  // Conversations list
  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  getConversations(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.whatsappService.getConversations(user.id);
  }

  // Messages in conversation
  @Get('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  getMessages(@Req() req: Request, @Param('id') id: string) {
    const user = req.user as { id: string };
    return this.whatsappService.getMessages(user.id, id);
  }

  // FIX-007: Uses service method instead of direct prisma access
  @Post('conversations/:id/events')
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body() dto: CreateConversationEventDto,
  ) {
    const user = req.user as { id: string };
    const conv = await this.whatsappService.getConversation(
      user.id,
      conversationId,
    );
    if (!conv) throw new NotFoundException('Conversation not found');

    const event = await this.eventsService.createEvent(user.id, {
      leadId: conv.leadId,
      conversationId,
      type: dto.type,
      value: dto.value,
      currency: dto.currency,
    });

    // FR14: Auto-create order on Purchase
    if (dto.type === 'Purchase') {
      await this.eventsService.autoCreateOrderOnPurchase(
        user.id,
        conv.leadId,
        conversationId,
        dto.value || 0,
        dto.currency || 'BRL',
      );
    }

    return event;
  }

  // Send message
  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard)
  sendMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const user = req.user as { id: string };
    return this.whatsappService.sendMessage(user.id, id, dto.content);
  }
}
