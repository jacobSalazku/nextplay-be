import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type {
  ThrottlerModuleOptions,
  ThrottlerStorage,
} from '@nestjs/throttler';
import { GqlThrottlerGuard } from './gql-throttler.guard';

/** Minimal GraphQL ExecutionContext: only what GqlExecutionContext.create reads. */
function gqlContext(gqlCtx: unknown): ExecutionContext {
  return {
    getType: () => 'graphql',
    getArgs: () => [undefined, undefined, gqlCtx, undefined],
    getClass: () => class {},
    getHandler: () => () => undefined,
  } as unknown as ExecutionContext;
}

describe('GqlThrottlerGuard', () => {
  const guard = new GqlThrottlerGuard(
    { throttlers: [] } as ThrottlerModuleOptions,
    {} as ThrottlerStorage,
    new Reflector(),
  );

  it('pulls req and res out of the GraphQL context', () => {
    const req = { ip: '1.2.3.4' };
    const res = { header: () => undefined };

    expect(guard.getRequestResponse(gqlContext({ req, res }))).toEqual({
      req,
      res,
    });
  });

  it('falls back to the `request` / `reply` aliases', () => {
    const request = { ip: '5.6.7.8' };
    const reply = { header: () => undefined };

    expect(guard.getRequestResponse(gqlContext({ request, reply }))).toEqual({
      req: request,
      res: reply,
    });
  });

  it('returns empty objects when the context carries neither', () => {
    expect(guard.getRequestResponse(gqlContext({}))).toEqual({
      req: {},
      res: {},
    });
  });
});
