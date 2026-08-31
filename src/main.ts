import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './config/cors';

import 'reflect-metadata';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const logger = new Logger('GraphQL');
  logger.log('GraphQL schema & types will be generated on startup');

  app.enableCors({
    origin: parseCorsOrigins(),
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // NOTE: `whitelist` / `forbidNonWhitelisted` are intentionally left off until
  // every input DTO has validation decorators (follow-up PR) — turning them on
  // now would strip/reject fields on the many DTOs that currently have none.
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port, '0.0.0.0');

  logger.log(`Server running at http://localhost:${process.env.PORT}/graphql`);
}

void bootstrap();
