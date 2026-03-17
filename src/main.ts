import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const logger = new Logger('GraphQL');
  logger.log('GraphQL schema & types will be generated on startup');

  app.enableCors({
    origin: 'http://localhost:3001',
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3001;

  await app.listen(port, '0.0.0.0');

  logger.log(`Server running at http://localhost:${process.env.PORT}/graphql`);
}

bootstrap();
