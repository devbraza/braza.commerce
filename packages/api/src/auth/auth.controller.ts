import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from './auth.service';

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
      domain: process.env.COOKIE_DOMAIN || undefined, // .brazachat.shop in production
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/settings?tab=integrations`);
  }

  @Get('me')
  async me(@Req() req: Request) {
    // Try JWT cookie first, fallback to DEFAULT_USER_ID
    let userId: string | undefined;
    const token = req.cookies?.jwt;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const payload = jwt.verify(token, secret) as { id: string };
          userId = payload.id;
        }
      } catch {
        // Invalid token, ignore
      }
    }
    userId = userId || process.env.DEFAULT_USER_ID;
    if (!userId) {
      return { id: null, email: null, name: null, facebookId: null, timezone: 'America/Sao_Paulo' };
    }
    return this.authService.getMe(userId);
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt');
    res.json({ status: 'ok' });
  }
}
