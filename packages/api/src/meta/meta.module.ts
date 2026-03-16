import { Module } from '@nestjs/common';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [MetaController],
  providers: [MetaService, PrismaService, CryptoService],
  exports: [MetaService],
})
export class MetaModule {}
