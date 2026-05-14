import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlTeamContext } from 'src/modules/auth/guards/coach-guard';

export const CurrentTeamId = createParamDecorator(
  (_, context: ExecutionContext) => {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext<GqlTeamContext>().req.teamId;
  },
);
