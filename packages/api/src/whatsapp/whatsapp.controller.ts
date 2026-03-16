import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { EventsService } from '../events/events.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WebhookRateLimitGuard, MessageRateLimitGuard } from '../common/guards/rate-limit.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { CreateConversationEventDto } from './dto/create-conversation-event.dto';

@Controller()
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly eventsService: EventsService,
  ) {}

  // Z-API webhook — receives messages (no HMAC, JSON direct)
  @Post('webhook/z-api')
  @UseGuards(WebhookRateLimitGuard)
  handleZApiWebhook(@Body() body: unknown, @Res() res: Response) {
    res.status(200).send('OK');

    const userId = process.env.DEFAULT_USER_ID;
    if (userId) {
      this.whatsappService.handleZApiWebhook(body, userId).catch(err => {
        this.logger.error('Webhook processing failed', err);
      });
    }
  }

  // Z-API delivery status webhook
  @Post('webhook/z-api/delivery')
  @UseGuards(WebhookRateLimitGuard)
  handleZApiDelivery(@Body() body: unknown, @Res() res: Response) {
    res.status(200).send('OK');
    this.whatsappService.handleDeliveryStatus(body).catch(err => {
      this.logger.error('Delivery webhook processing failed', err);
    });
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

  @Post('conversations/:id/events')
  @UseGuards(JwtAuthGuard)
  async createEvent(
    @Req() req: Request,
    @Param('id') conversationId: string,
    @Body() dto: CreateConversationEventDto,
  ) {
    const user = req.user as { id: string };
    const conv = await this.whatsappService.getConversation(user.id, conversationId);
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

  // Send message via Z-API
  @Post('conversations/:id/messages')
  @UseGuards(JwtAuthGuard, MessageRateLimitGuard)
  sendMessage(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    const user = req.user as { id: string };
    return this.whatsappService.sendMessage(user.id, id, {
      content: dto.content,
      type: dto.type || 'text',
      mediaUrl: dto.mediaUrl,
      fileName: dto.fileName,
    });
  }
}
