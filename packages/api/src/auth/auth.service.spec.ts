import { AuthService } from './auth.service';
import * as jwt from 'jsonwebtoken';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockCrypto: any;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.ENCRYPTION_KEY =
      'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2';

    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findUniqueOrThrow: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    mockCrypto = {
      encrypt: jest.fn().mockReturnValue('encrypted-token'),
      decrypt: jest.fn().mockReturnValue('decrypted-token'),
    };

    service = new AuthService(mockPrisma, mockCrypto);
  });

  describe('handleFacebookLogin', () => {
    const profile = {
      id: 'fb-123',
      displayName: 'Test User',
      emails: [{ value: 'test@test.com' }],
    };

    it('should create new user on first login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        facebookId: 'fb-123',
        email: 'test@test.com',
        name: 'Test User',
        timezone: 'America/Sao_Paulo',
        createdAt: new Date(),
      });

      const result = await service.handleFacebookLogin(
        'access-token',
        'refresh-token',
        profile,
      );

      expect(mockCrypto.encrypt).toHaveBeenCalledWith('access-token');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(result.user.id).toBe('user-1');
      expect(result.token).toBeDefined();
    });

    it('should update existing user on subsequent login', async () => {
      const existingUser = {
        id: 'user-1',
        facebookId: 'fb-123',
        email: 'test@test.com',
        name: 'Test User',
        timezone: 'America/Sao_Paulo',
        createdAt: new Date(),
      };
      mockPrisma.user.findUnique.mockResolvedValue(existingUser);
      mockPrisma.user.update.mockResolvedValue(existingUser);

      const result = await service.handleFacebookLogin(
        'new-access-token',
        'new-refresh-token',
        profile,
      );

      expect(mockPrisma.user.update).toHaveBeenCalled();
      expect(result.user.id).toBe('user-1');
    });

    it('should not expose tokens in response', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        facebookId: 'fb-123',
        email: 'test@test.com',
        name: 'Test User',
        timezone: 'America/Sao_Paulo',
        createdAt: new Date(),
        accessToken: 'encrypted',
        refreshToken: 'encrypted',
      });

      const result = await service.handleFacebookLogin(
        'access-token',
        undefined,
        profile,
      );

      expect((result.user as any).accessToken).toBeUndefined();
      expect((result.user as any).refreshToken).toBeUndefined();
    });
  });

  describe('generateJwt', () => {
    it('should generate valid JWT with user id', () => {
      const token = service.generateJwt('user-123');
      const decoded = jwt.verify(token, 'test-secret') as { id: string };
      expect(decoded.id).toBe('user-123');
    });
  });

  describe('getMe', () => {
    it('should return user without tokens', async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        facebookId: 'fb-123',
        email: 'test@test.com',
        name: 'Test User',
        timezone: 'America/Sao_Paulo',
        createdAt: new Date(),
        accessToken: 'should-not-appear',
      });

      const result = await service.getMe('user-1');
      expect(result.id).toBe('user-1');
      expect((result as any).accessToken).toBeUndefined();
    });
  });
});
