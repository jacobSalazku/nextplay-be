import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { TeamAccess, TeamAccessService } from '../team-access.service';

type TeamArgs = {
  routeKey?: string;
  teamId?: string;
  teamShortId?: string;
  input?: {
    routeKey?: string;
    teamId?: string;
    teamShortId?: string;
  };
};

type TeamRequest = {
  user?: { userId: string };
  team?: TeamAccess;
};

function extractTeamRef(args: TeamArgs): string | undefined {
  return (
    args.input?.routeKey ??
    args.routeKey ??
    args.input?.teamId ??
    args.teamId ??
    args.input?.teamShortId ??
    args.teamShortId
  );
}

async function assertTeamAccess(
  context: ExecutionContext,
  access: TeamAccessService,
  requiredRole?: Role,
): Promise<boolean> {
  const gql = GqlExecutionContext.create(context);
  const req = gql.getContext<{ req?: TeamRequest }>().req;

  if (!req?.user?.userId) {
    throw new ForbiddenException('User not authenticated');
  }

  const ref = extractTeamRef(gql.getArgs<TeamArgs>());

  if (!ref) {
    throw new BadRequestException('A team reference is required');
  }

  req.team = await access.requireMembership(ref, req.user.userId, requiredRole);

  return true;
}

/**
 * Requires the caller to be an ACTIVE member of the team referenced in the
 * resolver arguments. Populates `req.team` for `@CurrentTeam()`.
 */
@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(private readonly access: TeamAccessService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return assertTeamAccess(context, this.access);
  }
}

/**
 * Like {@link TeamMemberGuard}, but the member must also be a COACH.
 */
@Injectable()
export class TeamCoachGuard implements CanActivate {
  constructor(private readonly access: TeamAccessService) {}

  canActivate(context: ExecutionContext): Promise<boolean> {
    return assertTeamAccess(context, this.access, Role.COACH);
  }
}
