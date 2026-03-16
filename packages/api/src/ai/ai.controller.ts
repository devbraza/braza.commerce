import { Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('insights')
  getInsights(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.aiService.getInsights(user.id);
  }

  @Post('insights/generate')
  generateInsights(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.aiService.generateInsights(user.id);
  }
}
