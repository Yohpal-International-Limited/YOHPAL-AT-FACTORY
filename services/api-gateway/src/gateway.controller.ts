import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import {
  CreateFeedEventRequest,
  CreateFeedEventRequestSchema,
  CreateTrendRequest,
  CreateTrendRequestSchema,
  CreateVideoJobRequest,
  CreateVideoJobRequestSchema,
  GenerateScriptRequest,
  GenerateScriptRequestSchema,
  ModerateVideoRequest,
  ModerateVideoRequestSchema,
  RenderVideoRequest,
  RenderVideoRequestSchema,
} from '../../../contracts/api-contracts';
import { ZodValidationPipe } from '../../../libs/common/zod-validation.pipe';
import { OptionalTakePipe, RequiredQueryPipe } from '../../../libs/common/query-validation.pipe';

@Controller()
export class GatewayController {
  constructor(private readonly gatewayService: GatewayService) {}

  // Health
  @Get('health')
  async health() {
    return this.gatewayService.health();
  }

  // TREND
  @Post('trends')
  async createTrend(@Body(new ZodValidationPipe(CreateTrendRequestSchema)) body: CreateTrendRequest) {
    return this.gatewayService.createTrend(body);
  }

  @Post('trends/discover-seed')
  async discoverSeedTrends() {
    return this.gatewayService.discoverSeedTrends();
  }

  @Get('trends')
  async listTrends(
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    return this.gatewayService.listTrends({ category, region, country, take });
  }

  // SCRIPT
  @Post('scripts/generate')
  async generateScript(@Body(new ZodValidationPipe(GenerateScriptRequestSchema)) body: GenerateScriptRequest) {
    return this.gatewayService.generateScript(body);
  }

  @Post('scripts/generate-pending')
  async generatePendingScripts(@Query('take', OptionalTakePipe) take?: number) {
    return this.gatewayService.generatePendingScripts(take);
  }

  @Get('scripts')
  async listScripts(
    @Query('trendId') trendId?: string,
    @Query('language') language?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    return this.gatewayService.listScripts({ trendId, language, take });
  }

  // RENDER
  @Post('render/jobs')
  async createVideoJob(@Body(new ZodValidationPipe(CreateVideoJobRequestSchema)) body: CreateVideoJobRequest) {
    return this.gatewayService.createVideoJob(body);
  }

  @Post('render/jobs/create-pending')
  async createPendingVideoJobs(@Query('take', OptionalTakePipe) take?: number) {
    return this.gatewayService.createPendingVideoJobs(take);
  }

  @Post('render/videos/render')
  async renderVideo(@Body(new ZodValidationPipe(RenderVideoRequestSchema)) body: RenderVideoRequest) {
    return this.gatewayService.renderVideo(body);
  }

  @Post('render/videos/render-pending')
  async renderPendingVideos(@Query('take', OptionalTakePipe) take?: number) {
    return this.gatewayService.renderPendingVideos(take);
  }

  @Get('render/videos')
  async listVideos(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    return this.gatewayService.listVideos({ status, category, region, country, take });
  }

  // MODERATION
  @Post('moderation/videos/moderate')
  async moderateVideo(@Body(new ZodValidationPipe(ModerateVideoRequestSchema)) body: ModerateVideoRequest) {
    return this.gatewayService.moderateVideo(body);
  }

  @Post('moderation/videos/moderate-pending')
  async moderatePendingVideos(@Query('take', OptionalTakePipe) take?: number) {
    return this.gatewayService.moderatePendingVideos(take);
  }

  @Post('moderation/videos/:id/approve')
  async manualApprove(@Param('id') id: string) {
    return this.gatewayService.manualApprove(id);
  }

  @Post('moderation/videos/:id/reject')
  async manualReject(@Param('id') id: string) {
    return this.gatewayService.manualReject(id);
  }

  @Post('moderation/videos/:id/publish')
  async publishApproved(@Param('id') id: string) {
    return this.gatewayService.publishApproved(id);
  }

  @Post('moderation/videos/publish-approved')
  async publishAllApproved(@Query('take', OptionalTakePipe) take?: number) {
    return this.gatewayService.publishAllApproved(take);
  }

  @Get('moderation/queue')
  async listModerationQueue(
    @Query('action') action?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    return this.gatewayService.listModerationQueue({ action, take });
  }

  // PROVIDER JOBS
  @Get('provider-jobs')
  async listProviderJobs(
    @Query('jobType') jobType?: string,
    @Query('status') status?: string,
    @Query('providerName') providerName?: string,
    @Query('take', OptionalTakePipe) take?: number,
  ) {
    return this.gatewayService.listProviderJobs({ jobType, status, providerName, take });
  }

  @Get('provider-jobs/summary')
  async providerJobsSummary() {
    return this.gatewayService.providerJobsSummary();
  }

  // SCRIPT PROVIDER LOGS
  @Get('script-provider-logs')
  async listScriptProviderLogs(
    @Query('providerName') providerName?: string,
    @Query('status') status?: string,
    @Query('take', OptionalTakePipe) take?: number,
  ) {
    return this.gatewayService.listScriptProviderLogs({ providerName, status, take });
  }

  @Get('script-provider-logs/summary')
  async scriptProviderLogsSummary() {
    return this.gatewayService.scriptProviderLogsSummary();
  }

  // RECOMMENDATION
  @Get('feed/seed')
  async getSeedFeed(
    @Query('userId', new RequiredQueryPipe('userId')) userId: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('language') language?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    return this.gatewayService.getSeedFeed({ userId, region, country, language, take });
  }

  @Post('feed/events')
  async createFeedEvent(@Body(new ZodValidationPipe(CreateFeedEventRequestSchema)) body: CreateFeedEventRequest) {
    return this.gatewayService.createFeedEvent(body);
  }

  // ⚡ KILLER FEATURE: Run the entire pipeline in one call!
  @Post('pipeline/run-seed')
  async runSeedPipeline(@Query('take', OptionalTakePipe) take?: number) {
    return this.gatewayService.runSeedPipeline(take ?? 10);
  }
}
