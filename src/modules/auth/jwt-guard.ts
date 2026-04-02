import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GqlJwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<{ req?: Request; request?: Request }>();
    return (gqlContext.req ?? gqlContext.request) as Request;
  }

  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser,
    info?: { message?: string },
  ): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException(info?.message ?? 'Unauthorized');
    }

    return user;
  }
}
