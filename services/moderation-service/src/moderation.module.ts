import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ModerationController } from './moderation.controller';
import { ProviderLogsController } from './provider-logs.controller';
import { ModerationService } from './moderation.service';
import { PrismaService } from '../../../libs/database/prisma.service';
import { ServiceIdentityGuard } from '../../../libs/security/service-identity.guard';

@Module({
  controllers: [ModerationController, ProviderLogsController],
  providers: [ModerationService, PrismaService, { provide: APP_GUARD, useClass: ServiceIdentityGuard }],
})
export class ModerationModule {}
