import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TrendService } from './trend.service';
import { CreateTrendRequest, CreateTrendRequestSchema } from '../../../contracts/api-contracts';
import { ok } from '../../../libs/common/http-response';
import { ZodValidationPipe } from '../../../libs/common/zod-validation.pipe';
import { OptionalTakePipe } from '../../../libs/common/query-validation.pipe';

@Controller('trends')
export class TrendController {
  constructor(private readonly trendService: TrendService) {}

  @Post()
  async createTrend(@Body(new ZodValidationPipe(CreateTrendRequestSchema)) body: CreateTrendRequest) {
    const trend = await this.trendService.createTrend(body);
    return ok(trend);
  }

  @Post('discover-seed')
  async discoverSeedTrends() {
    const trends = await this.trendService.discoverSeedTrends();
    return ok(trends, { count: trends.length });
  }

  @Get()
  async listTrends(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    const trends = await this.trendService.listTrends({
      category,
      region,
      country,
      take,
    });
    return ok(trends, { count: trends.length });
  }

  @Get(':id')
  async getTrend(@Param('id') id: string) {
    const trend = await this.trendService.getTrend(id);
    return ok(trend);
  }
}
