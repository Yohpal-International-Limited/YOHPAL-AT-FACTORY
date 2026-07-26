import {
  createAvatarProvider,
  createTtsProvider,
  createVideoCompositorProvider,
} from '../../../ai/providers/provider-factory';
import { verifyRemoteAsset } from '../../../libs/media/asset-verifier';

export type MediaRenderPipelineInput = {
  videoId: string;
  title: string;
  scriptText: string;
  voiceId: string;
  avatarId?: string | null;
  avatarCategory: string;
  language: string;
  backgroundStyle?: string;
};

export type MediaRenderPipelineOutput = {
  audioUrl: string;
  avatarVideoUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  verification: Record<string, unknown>;
};

export class MediaRenderPipeline {
  async render(input: MediaRenderPipelineInput): Promise<MediaRenderPipelineOutput> {
    const tts = await createTtsProvider().synthesize(input.scriptText, {
      language: input.language,
      voice: input.voiceId,
    });
    const avatar = await createAvatarProvider().generateAvatar({
      script: input.scriptText,
      style: input.avatarCategory,
    });
    const composed = await createVideoCompositorProvider().compose({
      audioUrl: tts.audioUrl,
      avatarUrl: avatar.avatarUrl,
      visuals: [],
      style: input.backgroundStyle,
    });

    if (process.env.NODE_ENV !== 'production' && process.env.VERIFY_MOCK_ASSETS !== 'true') {
      return {
        audioUrl: tts.audioUrl,
        avatarVideoUrl: avatar.avatarUrl,
        videoUrl: composed.videoUrl,
        thumbnailUrl: composed.thumbnailUrl || '',
        durationSeconds: Math.ceil(composed.durationMs / 1000),
        verification: { mode: 'development-bypass' },
      };
    }

    const [audioAsset, avatarAsset, videoAsset] = await Promise.all([
      verifyRemoteAsset(tts.audioUrl, 'audio'),
      verifyRemoteAsset(avatar.avatarUrl, 'image'),
      verifyRemoteAsset(composed.videoUrl, 'video'),
    ]);
    const thumbnailAsset = composed.thumbnailUrl
      ? await verifyRemoteAsset(composed.thumbnailUrl, 'image')
      : undefined;
    return {
      audioUrl: audioAsset.url,
      avatarVideoUrl: avatarAsset.url,
      videoUrl: videoAsset.url,
      thumbnailUrl: thumbnailAsset?.url || '',
      durationSeconds: Math.ceil(composed.durationMs / 1000),
      verification: { audioAsset, avatarAsset, videoAsset, thumbnailAsset },
    };
  }
}
