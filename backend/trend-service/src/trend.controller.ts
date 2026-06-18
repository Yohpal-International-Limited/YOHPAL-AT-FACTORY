import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TrendService } from './trend.service';
import { CreateTrendRequest } from '../../../contracts/api-contracts';
import { ok } from '../../shared/http-response';

@Controller('trends')
export class TrendController {
  constructor(private readonly trendService: TrendService) {}

  @Post()
  async createTrend(@Body() body: CreateTrendRequest) {
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
    @Query('take') take?: string
  ) {
    const trends = await this.trendService.listTrends({
      category,
      region,
      country,
      take: take ? Number(take) : undefined,
    });
    return ok(trends, { count: trends.length });
  }

  @Get(':id')
  async getTrend(@Param('id') id: string) {
    const trend = await this.trendService.getTrend(id);
    return ok(trend);
  }
}
