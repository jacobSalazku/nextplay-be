import { ValidationPipe } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import helmet from '@fastify/helmet';
import { parseCorsOrigins } from './config/cors';

/**
 * App-level wiring shared by `main.ts` and the e2e tests: security headers,
 * CORS, and the global validation pipe.
 */
export async function configureApp(app: NestFastifyApplication): Promise<void> {
  // CSP is off: this is a JSON API that renders nothing except the dev Apollo
  // sandbox (which loads assets from a CDN).
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // NOTE: `whitelist` / `forbidNonWhitelisted` are intentionally left off until
  // every input DTO has validation decorators (follow-up PR).
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
}
