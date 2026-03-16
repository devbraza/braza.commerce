import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';
import { AuthResponseDto } from './dto/auth-response.dto';

interface FacebookProfile {
  id: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
  ) {}

  async handleFacebookLogin(
    accessToken: string,
    refreshToken: string | undefined,
    profile: FacebookProfile,
  ): Promise<{ user: AuthResponseDto; token: string }> {
    const encryptedAccess = this.crypto.encrypt(accessToken);
    const encryptedRefresh = refreshToken
      ? this.crypto.encrypt(refreshToken)
      : null;

    const email = profile.emails?.[0]?.value || null;

    let user = await this.prisma.user.findUnique({
      where: { facebookId: profile.id },
    });

    if (user) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
        },
      });
    } else {
      user = await this.prisma.user.create({
        data: {
          facebookId: profile.id,
          email,
          name: profile.displayName || null,
          accessToken: encryptedAccess,
          refreshToken: encryptedRefresh,
        },
      });
    }

    const token = this.generateJwt(user.id);

    return {
      user: this.toAuthResponse(user),
      token,
    };
  }

  async getMe(userId: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    return this.toAuthResponse(user);
  }

  generateJwt(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET environment variable is required');
    return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
  }

  private toAuthResponse(user: {
    id: string;
    email: string | null;
    name: string | null;
    facebookId: string | null;
    timezone: string;
    createdAt: Date;
  }): AuthResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      facebookId: user.facebookId,
      timezone: user.timezone,
      createdAt: user.createdAt,
    };
  }
}
