import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { WhatsAppConfigDto } from './dto/whatsapp-config.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(req.user.id, dto);
  }

  @Put('whatsapp')
  async saveWhatsAppConfig(@Req() req: any, @Body() dto: WhatsAppConfigDto) {
    return this.usersService.saveWhatsAppConfig(req.user.id, dto);
  }

  @Get('whatsapp/status')
  async getWhatsAppStatus(@Req() req: any) {
    return this.usersService.getWhatsAppStatus(req.user.id);
  }

  @Get('whatsapp/qrcode')
  async getWhatsAppQrCode(@Req() req: any) {
    return this.usersService.getWhatsAppQrCode(req.user.id);
  }

  @Get('whatsapp/device')
  async getWhatsAppDevice(@Req() req: any) {
    return this.usersService.getWhatsAppDevice(req.user.id);
  }

  @Post('whatsapp/restore')
  async restoreWhatsAppSession(@Req() req: any) {
    const success = await this.usersService.restoreWhatsAppSession(req.user.id);
    return { restored: success };
  }

  @Post('whatsapp/disconnect')
  async disconnectWhatsApp(@Req() req: any) {
    const success = await this.usersService.disconnectWhatsApp(req.user.id);
    return { disconnected: success };
  }

  @Post('facebook/disconnect')
  async disconnectFacebook(@Req() req: any) {
    return this.usersService.disconnectFacebook(req.user.id);
  }
}
