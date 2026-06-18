import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ScriptService } from './script.service';
import { GenerateScriptRequest } from '../../../contracts/api-contracts';
import { ok } from '../../shared/http-response';

@Controller('scripts')
export class ScriptController {
  constructor(private readonly scriptService: ScriptService) {}

  @Post('generate')
  async generateFromTrend(@Body() body: GenerateScriptRequest) {
    const result = await this.scriptService.generateFromTrend(body);
    return ok(result, { message: 'Script generated from trend' });
  }

  @Post('generate-pending')
  async generateForPendingTrends(@Query('take') take?: string) {
    const result = await this.scriptService.generateForAllPendingTrends(
      take ? Number(take) : 20
    );
    return ok(result, { count: result.length });
  }

  @Get()
  async listScripts(
    @Query('trendId') trendId?: string,
    @Query('language') language?: string,
    @Query('take') take?: string
  ) {
    const scripts = await this.scriptService.listScripts({
      trendId,
      language,
      take: take ? Number(take) : undefined,
    });
    return ok(scripts, { count: scripts.length });
  }

  @Get(':id')
  async getScript(@Param('id') id: string) {
    const script = await this.scriptService.getScript(id);
    return ok(script);
  }
}
