import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Body,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { WhatsAppConfigDto } from './dto/whatsapp-config.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // v1 single-tenant: use DEFAULT_USER_ID (no JWT auth yet)
  private getUserId(req: any): string {
    // Try JWT user first (future), fallback to DEFAULT_USER_ID
    const userId = req.user?.id || process.env.DEFAULT_USER_ID;
    if (!userId) {
      throw new BadRequestException('DEFAULT_USER_ID not configured');
    }
    return userId;
  }

  @Patch('settings')
  async updateSettings(@Req() req: any, @Body() dto: UpdateSettingsDto) {
    return this.usersService.updateSettings(this.getUserId(req), dto);
  }

  @Put('whatsapp')
  async saveWhatsAppConfig(@Req() req: any, @Body() dto: WhatsAppConfigDto) {
    return this.usersService.saveWhatsAppConfig(this.getUserId(req), dto);
  }

  @Get('whatsapp/status')
  async getWhatsAppStatus(@Req() req: any) {
    return this.usersService.getWhatsAppStatus(this.getUserId(req));
  }

  @Get('whatsapp/qrcode')
  async getWhatsAppQrCode(@Req() req: any) {
    return this.usersService.getWhatsAppQrCode(this.getUserId(req));
  }

  @Get('whatsapp/device')
  async getWhatsAppDevice(@Req() req: any) {
    return this.usersService.getWhatsAppDevice(this.getUserId(req));
  }

  @Post('whatsapp/restore')
  async restoreWhatsAppSession(@Req() req: any) {
    const success = await this.usersService.restoreWhatsAppSession(this.getUserId(req));
    return { restored: success };
  }

  @Post('whatsapp/disconnect')
  async disconnectWhatsApp(@Req() req: any) {
    const success = await this.usersService.disconnectWhatsApp(this.getUserId(req));
    return { disconnected: success };
  }

  @Post('facebook/disconnect')
  async disconnectFacebook(@Req() req: any) {
    return this.usersService.disconnectFacebook(this.getUserId(req));
  }
}
