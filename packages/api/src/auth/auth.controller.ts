import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  facebookLogin() {
    // Passport redirects to Facebook
  }

  @Get('callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookCallback(@Req() req: Request, @Res() res: Response) {
    const fbData = req.user as {
      accessToken: string;
      refreshToken: string;
      profile: { id: string; displayName?: string; emails?: Array<{ value: string }> };
    };

    const { token } = await this.authService.handleFacebookLogin(
      fbData.accessToken,
      fbData.refreshToken,
      fbData.profile,
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/settings?tab=integrations`);
  }

  @Get('me')
  async me(@Req() req: Request) {
    // v1: try JWT first, fallback to DEFAULT_USER_ID
    const jwtUser = req.user as { id: string } | undefined;
    const userId = jwtUser?.id || process.env.DEFAULT_USER_ID;
    if (!userId) {
      return { id: null, email: null, name: null, timezone: 'America/Sao_Paulo' };
    }
    return this.authService.getMe(userId);
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt');
    res.json({ status: 'ok' });
  }
}
