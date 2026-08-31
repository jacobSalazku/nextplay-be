import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GraphQLError } from 'graphql';

/**
 * `ThrottlerGuard` reads the request/response from an HTTP context by default.
 * This variant pulls them from the GraphQL execution context so throttling
 * works on the single `/graphql` endpoint. The bucket is per resolver method
 * per IP (see `ThrottlerGuard#generateKey`), so a tight limit on one mutation
 * doesn't starve the others.
 */
@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
  getRequestResponse(context: ExecutionContext): {
    req: Record<string, unknown>;
    res: Record<string, unknown>;
  } {
    const ctx = GqlExecutionContext.create(context).getContext<{
      req?: Record<string, unknown>;
      request?: Record<string, unknown>;
      res?: Record<string, unknown>;
      reply?: Record<string, unknown>;
    }>();

    return {
      req: ctx.req ?? ctx.request ?? {},
      res: ctx.res ?? ctx.reply ?? {},
    };
  }

  /**
   * The default throws a Nest `ThrottlerException` (HTTP 429). The Apollo
   * driver has no mapping for 429, so it would reach the client as an
   * `INTERNAL_SERVER_ERROR` — and `formatGraphqlError` would then mask it in
   * production. Throw a GraphQLError with an explicit code instead so the
   * client can tell it's being throttled and back off.
   */
  protected throwThrottlingException(): Promise<void> {
    throw new GraphQLError('Too many requests', {
      extensions: { code: 'TOO_MANY_REQUESTS' },
    });
  }
}
