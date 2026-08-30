/**
 * Boots the module graph far enough for @nestjs/graphql to (re)generate
 * `graphql/schema.graphql` and `graphql/generated/types.ts`, then exits.
 * No database or real keys required.
 *
 *   SKIP_DB_CONNECT=true pnpm ts-node -r tsconfig-paths/register scripts/generate-schema.ts
 *
 * CI runs `pnpm schema:check`, which runs this then `git diff --exit-code
 * graphql/` to catch a schema that has drifted from the resolvers.
 */
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import 'reflect-metadata';
import { AppModule } from '../src/app.module';

async function main() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter(), {
    logger: ['error', 'warn'],
    abortOnError: false,
  });
  await app.init();
  await app.close();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
