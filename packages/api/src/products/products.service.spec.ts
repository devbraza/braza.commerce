import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      campaign: {
        count: jest.fn(),
      },
    };
    service = new ProductsService(mockPrisma);
  });

  it('should create a product', async () => {
    const dto = {
      name: 'Test Product',
      price: 99.9,
      whatsappPhone: '+5511999999999',
      messageTemplate: 'Oi, quero saber sobre {product}',
    };
    mockPrisma.product.create.mockResolvedValue({ id: '1', ...dto, userId: 'u1' });
    const result = await service.create('u1', dto);
    expect(result.name).toBe('Test Product');
  });

  it('should list products for user with pagination', async () => {
    mockPrisma.product.findMany.mockResolvedValue([{ id: '1' }]);
    mockPrisma.product.count.mockResolvedValue(1);
    const result = await service.findAll('u1');
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(50);
  });

  it('should throw NotFoundException for missing product', async () => {
    mockPrisma.product.findFirst.mockResolvedValue(null);
    await expect(service.findOne('u1', 'bad-id')).rejects.toThrow(NotFoundException);
  });

  it('should block delete when product has campaigns', async () => {
    mockPrisma.product.findFirst.mockResolvedValue({ id: '1' });
    mockPrisma.campaign.count.mockResolvedValue(2);
    await expect(service.remove('u1', '1')).rejects.toThrow(BadRequestException);
  });

  it('should delete product with no campaigns', async () => {
    mockPrisma.product.findFirst.mockResolvedValue({ id: '1' });
    mockPrisma.campaign.count.mockResolvedValue(0);
    mockPrisma.product.delete.mockResolvedValue({ id: '1' });
    const result = await service.remove('u1', '1');
    expect(result.id).toBe('1');
  });
});
