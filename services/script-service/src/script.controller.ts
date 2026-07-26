import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ScriptService } from './script.service';
import { GenerateScriptRequest, GenerateScriptRequestSchema } from '../../../contracts/api-contracts';
import { ok } from '../../../libs/common/http-response';
import { ZodValidationPipe } from '../../../libs/common/zod-validation.pipe';
import { OptionalTakePipe } from '../../../libs/common/query-validation.pipe';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Post('generate')
  async generateFromTrend(@Body(new ZodValidationPipe(GenerateScriptRequestSchema)) body: GenerateScriptRequest) {
    const result = await this.scriptService.generateFromTrend(body);
    return ok(result, { message: 'Script generated from trend' });
  }

  @Post('generate-pending')
  async generateForPendingTrends(@Query('take', OptionalTakePipe) take?: number) {
    const result = await this.scriptService.generateForAllPendingTrends(
      take ?? 20
    );
    return ok(result, { count: result.length });
  }

  @Get()
  async listScripts(
    @Query('trendId') trendId?: string,
    @Query('language') language?: string,
    @Query('take', OptionalTakePipe) take?: number
  ) {
    const scripts = await this.scriptService.listScripts({
      trendId,
      language,
      take,
    });
    return ok(scripts, { count: scripts.length });
  }

  @Get(':id')
  async getScript(@Param('id') id: string) {
    const script = await this.scriptService.getScript(id);
    return ok(script);
  }
}
