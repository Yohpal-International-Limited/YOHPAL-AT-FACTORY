import { TtsProvider } from '../interfaces/tts-provider.interface';
import { callYohPalBrain } from './client';

export class YohPalBrainTtsProvider implements TtsProvider {
  async synthesize(text: string, options?: { language?: string; voice?: string }) {
    return callYohPalBrain<{ audioUrl: string; durationMs: number; metadata: Record<string, unknown> }>(
      '/v1/tts', { text, ...options }
    );
  }
}
