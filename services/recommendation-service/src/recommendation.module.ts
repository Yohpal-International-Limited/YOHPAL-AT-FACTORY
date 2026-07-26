import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { PrismaService } from '../../../libs/database/prisma.service';
import { ServiceIdentityGuard } from '../../../libs/security/service-identity.guard';

@Module({
  controllers: [RecommendationController],
  providers: [RecommendationService, PrismaService, { provide: APP_GUARD, useClass: ServiceIdentityGuard }],
})
export class RecommendationModule {}
