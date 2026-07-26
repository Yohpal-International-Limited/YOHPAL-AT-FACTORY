import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { env } from '../../../libs/common/env';
import { configureHttpSecurity } from '../../../libs/security/http-security';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureHttpSecurity(app, {
    allowedOrigins: env.corsAllowedOrigins,
    bodyLimit: env.requestBodyLimit,
    rateLimitWindowMs: env.rateLimitWindowMs,
    rateLimitMax: env.rateLimitMax,
  });
  await app.listen(env.apiGatewayPort);
  console.log(`✅ YohPal Live API Gateway running on port ${env.apiGatewayPort}`);
}
bootstrap();
