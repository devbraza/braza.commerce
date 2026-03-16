import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

/**
 * v1 Single-Tenant Auth Guard
 * Tries JWT cookie/header first, falls back to DEFAULT_USER_ID.
 * Always allows request through — never returns 401.
 * Replace with JwtAuthGuard when proper auth is implemented.
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Try JWT from cookie or header
    const token =
      request.cookies?.jwt || request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      try {
        const secret = process.env.JWT_SECRET;
        if (secret) {
          const payload = jwt.verify(token, secret);
          request.user = payload;
          return true;
        }
      } catch {
        // Invalid token, fall through to DEFAULT_USER_ID
      }
    }

    // Fallback: DEFAULT_USER_ID for v1 single-tenant
    const defaultUserId = process.env.DEFAULT_USER_ID;
    if (defaultUserId) {
      request.user = { id: defaultUserId };
    }

    return true;
  }
}
