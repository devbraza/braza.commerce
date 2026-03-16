import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  OnModuleInit,
} from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class WebhookRateLimitGuard implements CanActivate, OnModuleInit {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly maxRequests = 100; // 100 req/s per IP
  private readonly windowMs = 1000;

  onModuleInit() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now > entry.resetAt) this.store.delete(key);
      }
    }, 60000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const ip = request.ip || request.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    const entry = this.store.get(ip);
    if (!entry || now > entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > this.maxRequests) {
      throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}

@Injectable()
export class MessageRateLimitGuard implements CanActivate, OnModuleInit {
  private readonly store = new Map<string, RateLimitEntry>();
  private readonly maxMessages = 30; // 30 msg/min per conversation
  private readonly windowMs = 60000;

  onModuleInit() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store) {
        if (now > entry.resetAt) this.store.delete(key);
      }
    }, 60000);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const conversationId = request.params?.id;
    if (!conversationId) return true;

    const now = Date.now();
    const entry = this.store.get(conversationId);

    if (!entry || now > entry.resetAt) {
      this.store.set(conversationId, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > this.maxMessages) {
      throw new HttpException(
        'Limite de mensagens atingido. Aguarde alguns segundos.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    return true;
  }
}
