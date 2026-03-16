import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let service: CryptoService;

  beforeAll(() => {
    // 32 bytes = 64 hex chars
    process.env.ENCRYPTION_KEY =
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';
  });

  beforeEach(() => {
    service = new CryptoService();
  });

  it('should encrypt and decrypt a string (round-trip)', () => {
    const plaintext = 'my-secret-meta-token-12345';
    const encrypted = service.encrypt(plaintext);
    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('should produce different ciphertexts for same input (random IV)', () => {
    const plaintext = 'same-input';
    const a = service.encrypt(plaintext);
    const b = service.encrypt(plaintext);
    expect(a).not.toBe(b);
  });

  it('should return format iv:authTag:ciphertext in base64', () => {
    const encrypted = service.encrypt('test');
    const parts = encrypted.split(':');
    expect(parts).toHaveLength(3);
    // Each part should be valid base64
    parts.forEach((part) => {
      expect(() => Buffer.from(part, 'base64')).not.toThrow();
    });
  });

  it('should throw on invalid encrypted text format', () => {
    expect(() => service.decrypt('invalid')).toThrow(
      'Invalid encrypted text format',
    );
  });

  it('should throw on tampered ciphertext', () => {
    const encrypted = service.encrypt('test');
    const parts = encrypted.split(':');
    parts[2] = Buffer.from('tampered').toString('base64');
    expect(() => service.decrypt(parts.join(':'))).toThrow();
  });

  it('should throw if ENCRYPTION_KEY is missing', () => {
    const original = process.env.ENCRYPTION_KEY;
    delete process.env.ENCRYPTION_KEY;
    expect(() => new CryptoService()).toThrow(
      'ENCRYPTION_KEY environment variable is required',
    );
    process.env.ENCRYPTION_KEY = original;
  });
});
