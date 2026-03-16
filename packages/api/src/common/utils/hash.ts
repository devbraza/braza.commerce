import { createHash } from 'crypto';

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPhone(phone: string): string {
  return sha256(normalizePhone(phone));
}

export function hashEmail(email: string): string {
  return sha256(normalizeEmail(email));
}
