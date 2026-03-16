import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: dto.name,
        price: dto.price,
        currency: dto.currency || 'BRL',
        whatsappPhone: dto.whatsappPhone,
        messageTemplate: dto.messageTemplate,
        userId,
      },
    });
  }

  async findAll(userId: string, pagination?: { page?: number; limit?: number }) {
    const page = pagination?.page ?? 1;
    const limit = pagination?.limit ?? 50;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where: { userId } }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, userId },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(userId: string, id: string, dto: UpdateProductDto) {
    await this.findOne(userId, id);
    return this.prisma.product.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, id: string) {
    await this.findOne(userId, id);

    const campaignCount = await this.prisma.campaign.count({
      where: { productId: id },
    });

    if (campaignCount > 0) {
      throw new BadRequestException(
        `Cannot delete product: it is linked to ${campaignCount} campaign(s).`,
      );
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
