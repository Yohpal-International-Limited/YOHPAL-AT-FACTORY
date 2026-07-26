import { AvatarProvider } from '../interfaces/avatar-provider.interface';
import { callYohPalBrain } from './client';

export class YohPalBrainAvatarProvider implements AvatarProvider {
  async generateAvatar(options: { script: string; style?: string }) {
    return callYohPalBrain<{ avatarUrl: string; metadata: Record<string, unknown> }>(
      '/v1/avatars', options
    );
  }
}
