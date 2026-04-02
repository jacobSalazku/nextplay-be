import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (_, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<{
      req?: { user?: unknown };
      request?: { user?: unknown };
    }>();
    return (gqlContext.req ?? gqlContext.request)?.user;
  },
);
