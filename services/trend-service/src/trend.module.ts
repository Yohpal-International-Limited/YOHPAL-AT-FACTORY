import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TrendController } from './trend.controller';
import { TrendService } from './trend.service';
import { PrismaService } from '../../../libs/database/prisma.service';
import { ServiceIdentityGuard } from '../../../libs/security/service-identity.guard';

@Module({
  controllers: [TrendController],
  providers: [TrendService, PrismaService, { provide: APP_GUARD, useClass: ServiceIdentityGuard }],
})
export class TrendModule {}
