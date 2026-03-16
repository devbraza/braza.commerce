import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token =
      request.cookies?.jwt || request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const secret = process.env.JWT_SECRET;
      if (!secret) throw new Error('JWT_SECRET environment variable is required');
      const payload = jwt.verify(token, secret);
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
