import { Injectable } from '@nestjs/common';
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const envKey = process.env.ENCRYPTION_KEY;
    if (!envKey) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    this.key = Buffer.from(envKey, 'hex');
    if (this.key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivB64, authTagB64, ciphertext] = encryptedText.split(':');
    if (!ivB64 || !authTagB64 || !ciphertext) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');

    const decipher = createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
