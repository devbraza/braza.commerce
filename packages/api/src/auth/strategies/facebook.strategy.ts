import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor() {
    super({
      clientID: process.env.FACEBOOK_APP_ID || '',
      clientSecret: process.env.FACEBOOK_APP_SECRET || '',
      callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/auth/callback`,
      scope: [
        'ads_management',
        'ads_read',
        'business_management',
        'whatsapp_business_management',
      ],
      profileFields: ['id', 'emails', 'name', 'displayName'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    profile: Profile;
  }> {
    return { accessToken, refreshToken, profile };
  }
}
