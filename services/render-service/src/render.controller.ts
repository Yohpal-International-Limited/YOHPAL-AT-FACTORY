import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { RenderService } from './render.service';
import {
  CreateVideoJobRequest,
  CreateVideoJobRequestSchema,
  RenderVideoRequest,
  RenderVideoRequestSchema,
} from '../../../contracts/api-contracts';
import { ok } from '../../../libs/common/http-response';
import { ZodValidationPipe } from '../../../libs/common/zod-validation.pipe';
import { OptionalTakePipe } from '../../../libs/common/query-validation.pipe';

@Controller('render')
export class RenderController {
  constructor(private readonly renderService: RenderService) {}

  @Post('jobs')
  async createVideoJob(@Body(new ZodValidationPipe(CreateVideoJobRequestSchema)) body: CreateVideoJobRequest) {
    const video = await this.renderService.createVideoJob(body);
    return ok(video, { message: 'Video render job created' });
  }

  @Post('jobs/create-pending')
  async createJobsForUnrenderedScripts(@Query('take', OptionalTakePipe) take?: number) {
    const videos = await this.renderService.createJobsForUnrenderedScripts(
      take ?? 20
    );
    return ok(videos, { count: videos.length });
  }

  @Post('videos/render')
  async renderVideo(@Body(new ZodValidationPipe(RenderVideoRequestSchema)) body: RenderVideoRequest) {
    const video = await this.renderService.renderVideo(body);
    return ok(video, { message: 'Video rendered' });
  }

  @Post('videos/render-pending')
  async renderPendingVideos(@Query('take', OptionalTakePipe) take?: number) {
    const videos = await this.renderService.renderPendingVideos(
      take ?? 20
    );
    return ok(videos, { count: videos.length });
  }

  @Get('videos')
  async listVideos(
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('region') region?: string,
    @Query('country') country?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    const videos = await this.renderService.listVideos({
      status,
      category,
      region,
      country,
      take,
    });
    return ok(videos, { count: videos.length });
  }

  @Get('videos/:id')
  async getVideo(@Param('id') id: string) {
    const video = await this.renderService.getVideo(id);
    return ok(video);
  }
}
