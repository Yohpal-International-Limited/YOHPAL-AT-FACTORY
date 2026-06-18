import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { RenderModule } from './render.module';
import { env } from '../../shared/env';

async function bootstrap() {
  const app = await NestFactory.create(RenderModule);
  app.enableCors({ origin: '*' });
  await app.listen(env.renderServicePort);
  console.log(`✅ YohPal Live Render Service running on port ${env.renderServicePort}`);
}
bootstrap();
