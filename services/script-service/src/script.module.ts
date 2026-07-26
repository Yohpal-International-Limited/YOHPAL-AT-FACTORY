import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ScriptController } from './script.controller';
import { ScriptService } from './script.service';
import { PrismaService } from '../../../libs/database/prisma.service';
import { ServiceIdentityGuard } from '../../../libs/security/service-identity.guard';

@Module({
  controllers: [ScriptController],
  providers: [ScriptService, PrismaService, { provide: APP_GUARD, useClass: ServiceIdentityGuard }],
})
export class ScriptModule {}
