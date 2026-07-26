import { INestApplication } from '@nestjs/common';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

export type HttpSecurityConfig = {
  allowedOrigins: string[];
  bodyLimit: string;
  rateLimitWindowMs: number;
  rateLimitMax: number;
};

export function configureHttpSecurity(app: INestApplication, config: HttpSecurityConfig): void {
  app.use(helmet());
  app.use(rateLimit({
    windowMs: config.rateLimitWindowMs,
    limit: config.rateLimitMax,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  }));
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(express.urlencoded({ extended: false, limit: config.bodyLimit }));
  app.enableCors({
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed'));
    },
  });
}
