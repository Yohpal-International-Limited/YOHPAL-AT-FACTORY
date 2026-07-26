import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { RenderController } from './render.controller';
import { RenderService } from './render.service';
import { PrismaService } from '../../../libs/database/prisma.service';
import { ServiceIdentityGuard } from '../../../libs/security/service-identity.guard';

@Module({
  controllers: [RenderController],
  providers: [RenderService, PrismaService, { provide: APP_GUARD, useClass: ServiceIdentityGuard }],
})
export class RenderModule {}
