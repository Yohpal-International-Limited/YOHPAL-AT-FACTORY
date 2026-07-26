export interface VideoCompositorProvider {
  compose(input: {
    audioUrl: string;
    avatarUrl?: string;
    visuals: string[];
    style?: string;
  }): Promise<{
    videoUrl: string;
    thumbnailUrl?: string;
    durationMs: number;
    metadata: Record<string, unknown>;
  }>;
}
