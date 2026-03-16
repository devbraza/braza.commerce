import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AdCostService } from './ad-cost.service';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const mockPrisma = {
  adAccount: { findFirst: jest.fn(), findMany: jest.fn() },
  user: { findUniqueOrThrow: jest.fn(), findMany: jest.fn() },
  adCostSnapshot: { upsert: jest.fn(), findFirst: jest.fn() },
  campaign: { findMany: jest.fn(), update: jest.fn() },
};

const mockCrypto = {
  decrypt: jest.fn().mockReturnValue('decrypted-token'),
};

describe('AdCostService', () => {
  let service: AdCostService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdCostService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CryptoService, useValue: mockCrypto },
      ],
    }).compile();

    service = module.get<AdCostService>(AdCostService);
  });

  const mockInsightsResponse = (data: object[], nextPage?: string) => ({
    ok: true,
    json: async () => ({
      data,
      paging: nextPage ? { next: nextPage } : {},
    }),
  });

  const sampleRow = {
    campaign_id: '120212345678',
    campaign_name: 'Brain Caps V2 - Conversoes',
    spend: '45.23',
    impressions: '1523',
    reach: '892',
    clicks: '67',
    cpc: '0.675',
    cpm: '29.70',
    date_start: '2026-03-14',
    date_stop: '2026-03-14',
  };

  describe('syncCosts', () => {
    beforeEach(() => {
      mockPrisma.adAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        metaId: 'act_123',
        userId: 'user-1',
      });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        accessToken: 'encrypted-token',
      });
      mockPrisma.adCostSnapshot.upsert.mockResolvedValue({});
      mockPrisma.campaign.findMany.mockResolvedValue([]);
    });

    it('should sync costs from Meta API (normal response)', async () => {
      mockFetch.mockResolvedValueOnce(mockInsightsResponse([sampleRow]));

      const result = await service.syncCosts('user-1', 'acc-1', '2026-03-14', '2026-03-16');

      expect(result.synced).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(mockPrisma.adCostSnapshot.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            adAccountId_campaignMetaId_date: {
              adAccountId: 'acc-1',
              campaignMetaId: '120212345678',
              date: new Date('2026-03-14'),
            },
          },
          create: expect.objectContaining({
            spend: 45.23,
            clicks: 67,
            cpc: 0.675,
          }),
        }),
      );
    });

    it('should handle pagination (2 pages)', async () => {
      mockFetch
        .mockResolvedValueOnce(mockInsightsResponse([sampleRow], 'https://graph.facebook.com/next-page'))
        .mockResolvedValueOnce(mockInsightsResponse([{ ...sampleRow, date_start: '2026-03-15' }]));

      const result = await service.syncCosts('user-1', 'acc-1', '2026-03-14', '2026-03-16');

      expect(result.synced).toBe(2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should throw UnauthorizedException on expired token (code 190)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: { code: 190, message: 'Token expired' } }),
      });

      await expect(
        service.syncCosts('user-1', 'acc-1', '2026-03-14', '2026-03-16'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should handle empty response (0 campaigns)', async () => {
      mockFetch.mockResolvedValueOnce(mockInsightsResponse([]));

      const result = await service.syncCosts('user-1', 'acc-1', '2026-03-14', '2026-03-16');

      expect(result.synced).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should return error when ad account not found', async () => {
      mockPrisma.adAccount.findFirst.mockResolvedValue(null);

      const result = await service.syncCosts('user-1', 'bad-acc', '2026-03-14', '2026-03-16');

      expect(result.synced).toBe(0);
      expect(result.errors).toContain('Ad account not found.');
    });
  });

  describe('autoLinkCampaigns', () => {
    it('should auto-link when exactly 1 campaign matches', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        { id: 'camp-1', name: 'Brain Caps V2', campaignMetaId: null },
      ]);
      mockFetch.mockResolvedValueOnce(mockInsightsResponse([sampleRow]));

      mockPrisma.adAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        metaId: 'act_123',
        userId: 'user-1',
      });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        accessToken: 'enc',
      });
      mockPrisma.adCostSnapshot.upsert.mockResolvedValue({});

      await service.syncCosts('user-1', 'acc-1', '2026-03-14', '2026-03-16');

      expect(mockPrisma.campaign.update).toHaveBeenCalledWith({
        where: { id: 'camp-1' },
        data: { campaignMetaId: '120212345678' },
      });
    });

    it('should NOT auto-link when multiple campaigns match (ambiguous)', async () => {
      mockPrisma.campaign.findMany.mockResolvedValue([
        { id: 'camp-1', name: 'Brain Caps', campaignMetaId: null },
        { id: 'camp-2', name: 'Brain Caps V2', campaignMetaId: null },
      ]);
      mockFetch.mockResolvedValueOnce(mockInsightsResponse([sampleRow]));

      mockPrisma.adAccount.findFirst.mockResolvedValue({
        id: 'acc-1',
        metaId: 'act_123',
        userId: 'user-1',
      });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        accessToken: 'enc',
      });
      mockPrisma.adCostSnapshot.upsert.mockResolvedValue({});

      await service.syncCosts('user-1', 'acc-1', '2026-03-14', '2026-03-16');

      expect(mockPrisma.campaign.update).not.toHaveBeenCalled();
    });
  });

  describe('getLastSyncAt', () => {
    it('should return latest syncedAt', async () => {
      const date = new Date('2026-03-16T02:00:00Z');
      mockPrisma.adCostSnapshot.findFirst.mockResolvedValue({ syncedAt: date });

      const result = await service.getLastSyncAt('user-1');
      expect(result).toEqual(date);
    });

    it('should return null when no snapshots', async () => {
      mockPrisma.adCostSnapshot.findFirst.mockResolvedValue(null);

      const result = await service.getLastSyncAt('user-1');
      expect(result).toBeNull();
    });
  });

  describe('syncAllForUser', () => {
    it('should sync all ad accounts for user', async () => {
      mockPrisma.adAccount.findMany.mockResolvedValue([
        { id: 'acc-1', metaId: 'act_111', userId: 'user-1' },
        { id: 'acc-2', metaId: 'act_222', userId: 'user-1' },
      ]);
      mockPrisma.adAccount.findFirst
        .mockResolvedValueOnce({ id: 'acc-1', metaId: 'act_111', userId: 'user-1' })
        .mockResolvedValueOnce({ id: 'acc-2', metaId: 'act_222', userId: 'user-1' });
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        id: 'user-1',
        accessToken: 'enc',
      });
      mockPrisma.campaign.findMany.mockResolvedValue([]);
      mockFetch
        .mockResolvedValueOnce(mockInsightsResponse([sampleRow]))
        .mockResolvedValueOnce(mockInsightsResponse([]));
      mockPrisma.adCostSnapshot.upsert.mockResolvedValue({});

      const result = await service.syncAllForUser('user-1');

      expect(result.synced).toBe(1);
      expect(mockPrisma.adAccount.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });
});
