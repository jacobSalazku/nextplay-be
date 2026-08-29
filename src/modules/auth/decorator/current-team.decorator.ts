import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { TeamAccess } from '../team-access.service';

/**
 * Returns the team access context ({ teamId, memberId, role }) that
 * TeamMemberGuard / TeamCoachGuard resolved for this request. Undefined if
 * neither guard ran.
 */
export const CurrentTeam = createParamDecorator(
  (_data, context: ExecutionContext): TeamAccess | undefined => {
    const gql = GqlExecutionContext.create(context);
    return gql.getContext<{ req?: { team?: TeamAccess } }>().req?.team;
  },
);
