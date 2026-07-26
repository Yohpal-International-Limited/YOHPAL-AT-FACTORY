import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import { PrismaService } from '../../../libs/database/prisma.service';
import { JwtAuthGuard, RolesGuard } from '../../../libs/security/auth';
import { AdminAuditService } from '../../../libs/audit/admin-audit.service';
import { AdminAuditInterceptor } from '../../../libs/audit/admin-audit.interceptor';

@Module({
  controllers: [GatewayController],
  providers: [
    GatewayService,
    PrismaService,
    AdminAuditService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: AdminAuditInterceptor },
  ],
})
export class AppModule {}
