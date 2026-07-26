import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import {
  CreateFeedEventRequest,
  CreateFeedEventRequestSchema,
  SeedFeedRequest,
} from '../../../contracts/api-contracts';
import { ok } from '../../../libs/common/http-response';
import { ZodValidationPipe } from '../../../libs/common/zod-validation.pipe';
import { OptionalTakePipe, RequiredQueryPipe } from '../../../libs/common/query-validation.pipe';

@Controller()
export class RecommendationController {
  constructor(private readonly recommendationService: RecommendationService) {}

  @Get('feed/seed')
  async getSeedFeed(
    @Query('userId', new RequiredQueryPipe('userId')) userId: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('language') language?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    const request: SeedFeedRequest = {
      userId,
      region,
      country,
      language,
      take,
    };
    const feed = await this.recommendationService.getSeedFeed(request);
    return ok(feed, { count: feed.length });
  }

  @Post('feed/events')
  async createFeedEvent(@Body(new ZodValidationPipe(CreateFeedEventRequestSchema)) body: CreateFeedEventRequest) {
    const event = await this.recommendationService.createFeedEvent(body);
    return ok(event, { message: 'Feed event recorded' });
  }

  @Get('videos/:id')
  async getVideoById(@Param('id') id: string) {
    const video = await this.recommendationService.getVideoById(id);
    return ok(video);
  }
}
