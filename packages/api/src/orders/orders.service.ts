import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/services/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private async generateOrderId(userId: string): Promise<string> {
    const lastOrder = await this.prisma.order.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { orderId: true },
    });
    const lastNum = lastOrder?.orderId
      ? parseInt(lastOrder.orderId.replace('ORD-', ''), 10) || 0
      : 0;
    return `ORD-${String(lastNum + 1).padStart(4, '0')}`;
  }

  async create(
    userId: string,
    data: {
      leadId: string;
      conversationId?: string;
      productId?: string;
      value: number;
      currency?: string;
    },
  ) {
    const orderId = await this.generateOrderId(userId);
    return this.prisma.order.create({
      data: {
        orderId,
        leadId: data.leadId,
        conversationId: data.conversationId,
        productId: data.productId,
        value: data.value,
        currency: data.currency || 'BRL',
        userId,
      },
    });
  }

  async findAll(userId: string, filters?: { status?: string; page?: number; limit?: number }) {
    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 50;
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(filters?.status && { status: filters.status }),
    };

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          lead: { select: { phone: true, name: true } },
          product: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findOne(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, userId },
      include: { lead: true, product: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateAddress(
    userId: string,
    id: string,
    address: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    },
  ) {
    await this.findOne(userId, id);
    return this.prisma.order.update({ where: { id }, data: address });
  }

  async updateStatus(userId: string, id: string, status: string) {
    await this.findOne(userId, id);
    return this.prisma.order.update({ where: { id }, data: { status } });
  }

  async setTrackingCode(userId: string, id: string, trackingCode: string) {
    await this.findOne(userId, id);
    return this.prisma.order.update({
      where: { id },
      data: { trackingCode, status: 'shipped' },
    });
  }
}
