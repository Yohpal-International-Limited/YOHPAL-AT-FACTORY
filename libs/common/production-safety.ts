export type ProviderConfig = {
  nodeEnv: string;
  llmProvider: string;
  ttsProvider: string;
  avatarProvider: string;
  videoRenderProvider: string;
  moderationProvider: string;
  factCheckProvider: string;
  aiProviderApiKey?: string;
};

export function assertProductionProviders(config: ProviderConfig): void {
  if (config.nodeEnv !== 'production') return;

  const mockProviders = Object.entries(config)
    .filter(([name, value]) => name.endsWith('Provider') && value === 'mock')
    .map(([name]) => name);
  if (mockProviders.length > 0) {
    throw new Error(
      `Production cannot start with mock providers: ${mockProviders.join(', ')}`
    );
  }
  const usesYohPalBrain = Object.entries(config).some(
    ([name, value]) => name.endsWith('Provider') && value === 'yohpal_brain'
  );
  if (usesYohPalBrain && !config.aiProviderApiKey) {
    throw new Error('AI_PROVIDER_API_KEY is required for yohpal_brain providers');
  }
}

export function assertProductionSecurity(config: {
  nodeEnv: string;
  jwtSecret: string;
  jwtJwksUri?: string;
  serviceAuthToken: string;
  corsAllowedOrigins?: string[];
}): void {
  if (config.nodeEnv !== 'production') return;
  if (config.jwtJwksUri && !config.jwtJwksUri.startsWith('https://')) {
    throw new Error('JWT_JWKS_URI must use HTTPS in production');
  }
  if (!config.jwtJwksUri && Buffer.byteLength(config.jwtSecret) < 32) {
    throw new Error('JWT_SECRET must be at least 32 bytes in production');
  }
  if (Buffer.byteLength(config.serviceAuthToken) < 32) {
    throw new Error('SERVICE_AUTH_TOKEN must be at least 32 bytes in production');
  }
  if (!config.jwtJwksUri && config.jwtSecret === config.serviceAuthToken) {
    throw new Error('JWT_SECRET and SERVICE_AUTH_TOKEN must be different');
  }
  if (!config.corsAllowedOrigins?.length || config.corsAllowedOrigins.includes('*')) {
    throw new Error('CORS_ALLOWED_ORIGINS must explicitly list trusted origins');
  }
}
