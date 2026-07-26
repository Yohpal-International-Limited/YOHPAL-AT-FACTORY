import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ModerationAction } from '@prisma/client';
import { ModerationService } from './moderation.service';
import { ModerateVideoRequest, ModerateVideoRequestSchema } from '../../../contracts/api-contracts';
import { ok } from '../../../libs/common/http-response';
import { ZodValidationPipe } from '../../../libs/common/zod-validation.pipe';
import { OptionalTakePipe } from '../../../libs/common/query-validation.pipe';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('videos/moderate')
  async moderateVideo(@Body(new ZodValidationPipe(ModerateVideoRequestSchema)) body: ModerateVideoRequest) {
    const result = await this.moderationService.moderateVideo(body);
    return ok(result, { message: 'Video moderation completed' });
  }

  @Post('videos/moderate-pending')
  async moderatePendingVideos(@Query('take', OptionalTakePipe) take?: number) {
    const result = await this.moderationService.moderatePendingVideos(
      take ?? 20
    );
    return ok(result, { count: result.length });
  }

  @Post('videos/:id/approve')
  async manualApprove(@Param('id') id: string) {
    const result = await this.moderationService.manualApprove(id);
    return ok(result, { message: 'Video manually approved' });
  }

  @Post('videos/:id/reject')
  async manualReject(@Param('id') id: string) {
    const result = await this.moderationService.manualReject(id);
    return ok(result, { message: 'Video manually rejected' });
  }

  @Post('videos/:id/publish')
  async publishApprovedVideo(@Param('id') id: string) {
    const result = await this.moderationService.publishApprovedVideo(id);
    return ok(result, { message: 'Approved video published' });
  }

  @Post('videos/publish-approved')
  async publishAllApproved(@Query('take', OptionalTakePipe) take?: number) {
    const result = await this.moderationService.publishAllApproved(
      take ?? 20
    );
    return ok(result, { count: result.length });
  }

  @Get('queue')
  async listModerationQueue(
    @Query('action') action?: ModerationAction,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    const result = await this.moderationService.listModerationQueue({
      action,
      take,
    });
    return ok(result, { count: result.length });
  }

  @Get('videos/:id/history')
  async getModerationHistory(@Param('id') id: string) {
    const result = await this.moderationService.getModerationHistory(id);
    return ok(result, { count: result.length });
  }
}
