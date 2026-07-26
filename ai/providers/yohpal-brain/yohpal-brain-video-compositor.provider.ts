import { VideoCompositorProvider } from '../interfaces/video-compositor-provider.interface';
import { callYohPalBrain } from './client';

export class YohPalBrainVideoCompositorProvider implements VideoCompositorProvider {
  async compose(input: { audioUrl: string; avatarUrl?: string; visuals: string[]; style?: string }) {
    return callYohPalBrain<{ videoUrl: string; durationMs: number; metadata: Record<string, unknown> }>(
      '/v1/videos/compose', input
    );
  }
}
