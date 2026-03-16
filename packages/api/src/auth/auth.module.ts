import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { PrismaService } from '../common/services/prisma.service';
import { CryptoService } from '../common/services/crypto.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, FacebookStrategy, PrismaService, CryptoService],
  exports: [AuthService],
})
export class AuthModule {}
