import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { TrendModule } from './trend.module';
import { env } from '../../shared/env';

async function bootstrap() {
  const app = await NestFactory.create(TrendModule);
  app.enableCors({ origin: '*' });
  await app.listen(env.trendServicePort);
  console.log(`✅ YohPal Live Trend Service running on port ${env.trendServicePort}`);
}
bootstrap();
