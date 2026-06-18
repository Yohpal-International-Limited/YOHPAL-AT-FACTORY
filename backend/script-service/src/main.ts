import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ScriptModule } from './script.module';
import { env } from '../../shared/env';

async function bootstrap() {
  const app = await NestFactory.create(ScriptModule);
  app.enableCors({ origin: '*' });
  await app.listen(env.scriptServicePort);
  console.log(`✅ YohPal Live Script Service running on port ${env.scriptServicePort}`);
}
bootstrap();
