import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const signature = request.headers['x-hub-signature-256'];
    const appSecret = process.env.FACEBOOK_APP_SECRET;

    if (!appSecret) {
      throw new ForbiddenException('FACEBOOK_APP_SECRET not configured');
    }

    if (!signature) {
      throw new ForbiddenException('Missing X-Hub-Signature-256 header');
    }

    const rawBody = JSON.stringify(request.body);
    const expectedSignature =
      'sha256=' +
      createHmac('sha256', appSecret).update(rawBody).digest('hex');

    if (signature !== expectedSignature) {
      throw new ForbiddenException('Invalid webhook signature');
    }

    return true;
  }
}
