export type ProviderConfig = {
  nodeEnv: string;
  llmProvider: string;
  ttsProvider: string;
  avatarProvider: string;
  videoRenderProvider: string;
  moderationProvider: string;
};

export function assertProductionProviders(config: ProviderConfig): void {
  if (config.nodeEnv !== 'production') return;

  const mockProviders = Object.entries(config)
    .filter(([name, value]) => name !== 'nodeEnv' && value.toLowerCase() === 'mock')
    .map(([name]) => name);
  if (mockProviders.length > 0) {
    throw new Error(
      `Production cannot start with mock providers: ${mockProviders.join(', ')}`
    );
  }
}
