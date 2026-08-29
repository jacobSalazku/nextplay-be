import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role } from '@prisma/client';
import { Request } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';

export type JwtUser = {
  userId: string;
};

export type GqlTeamContext = {
  req: Request & {
    user: JwtUser;
    teamId?: string;
  };
};

type ArgsType = {
  input?: {
    teamId?: string;
    routeKey?: string;
  };
  teamId?: string;
  routeKey?: string;
};

@Injectable()
export class CoachGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const { req } = ctx.getContext<GqlTeamContext>();
    const user = req.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const args = ctx.getArgs<ArgsType>();

    const rawRouteKey =
      args.input?.teamId ??
      args.teamId ??
      args.input?.routeKey ??
      args.routeKey;

    if (!rawRouteKey) {
      throw new ForbiddenException('Team ID is required');
    }

    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { id: rawRouteKey },
          { shortId: rawRouteKey },
          { routeKey: rawRouteKey },
          { slug: rawRouteKey },
        ],
      },
      select: { id: true },
    });

    if (!team) {
      throw new ForbiddenException('Team not found');
    }

    const member = await this.prisma.member.findFirst({
      where: {
        userId: user.userId,
        teamId: team.id,
      },
      select: { role: true },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this team');
    }

    if (member.role !== Role.COACH) {
      throw new ForbiddenException('You do not have permission');
    }

    return true;
  }
}
