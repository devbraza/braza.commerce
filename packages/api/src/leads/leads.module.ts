import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { PrismaService } from '../common/services/prisma.service';

@Module({
  controllers: [LeadsController],
  providers: [LeadsService, PrismaService],
  exports: [LeadsService],
})
export class LeadsModule {}
