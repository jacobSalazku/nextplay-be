import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { GqlThrottlerGuard } from './gql-throttler.guard';

/**
 * Per-IP, per-resolver rate limiting. Coarse global default (300/min);
 * sensitive auth mutations tighten it with `@Throttle` (10/min). In-memory
 * store — fine for a single instance; use a Redis storage adapter when
 * scaling horizontally.
 *
 * Skipped entirely under `NODE_ENV=test` (keeps the suite deterministic) and
 * when `THROTTLE_DISABLED=true` (load testing / incident escape hatch).
 */
@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60_000, limit: 300 }],
      skipIf: () =>
        process.env.NODE_ENV === 'test' ||
        process.env.THROTTLE_DISABLED === 'true',
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: GqlThrottlerGuard }],
})
export class RateLimitModule {}
