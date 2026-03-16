import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { ZApiService } from './zapi.service';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ZApiService, PrismaService, CryptoService],
  exports: [UsersService, ZApiService],
})
export class UsersModule {}
