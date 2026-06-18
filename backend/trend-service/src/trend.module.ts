import { Module } from '@nestjs/common';
import { TrendController } from './trend.controller';
import { TrendService } from './trend.service';
import { PrismaService } from '../../shared/prisma.service';

@Module({
  controllers: [TrendController],
  providers: [TrendService, PrismaService],
})
export class TrendModule {}
