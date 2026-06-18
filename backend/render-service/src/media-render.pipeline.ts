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
};

export class MediaRenderPipeline {
  async render(input: MediaRenderPipelineInput): Promise<MediaRenderPipelineOutput> {
    // Mock implementation — just return fake URLs
    const baseUrl = process.env.CDN_BASE_URL || 'https://cdn.yohpal.com';
    return {
      audioUrl: `${baseUrl}/audio/${input.videoId}.mp3`,
      avatarVideoUrl: `${baseUrl}/avatar/${input.videoId}.mp4`,
      videoUrl: `${baseUrl}/videos/${input.videoId}.mp4`,
      thumbnailUrl: `${baseUrl}/thumbnails/${input.videoId}.jpg`,
      durationSeconds: 45,
    };
  }
}
