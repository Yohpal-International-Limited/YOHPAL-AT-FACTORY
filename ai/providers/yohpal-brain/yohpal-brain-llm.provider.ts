import { LlmScriptProvider } from '../interfaces/llm-script-provider.interface';
import { callYohPalBrain } from './client';

export class YohPalBrainLlmProvider implements LlmScriptProvider {
  async generateScript(prompt: string, context?: Record<string, unknown>) {
    return callYohPalBrain<{
      title: string; hook: string; body: string; cta: string; metadata: Record<string, unknown>;
    }>('/v1/scripts', { prompt, context });
  }
}
