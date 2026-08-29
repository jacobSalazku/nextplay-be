import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export type TeamAccess = {
  teamId: string;
  memberId: string;
  role: Role;
};

/**
 * Single source of truth for "may this user act on this team, and as what
 * role". Resolvers and guards should go through here instead of re-deriving
 * team membership by hand.
 */
@Injectable()
export class TeamAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolve any public team reference — internal id, shortId, routeKey, slug
   * or join code — to the canonical team id. Use this only when you need the
   * id without an access check (e.g. a public lookup); anything team-scoped
   * should go through {@link requireMembership}.
   */
  async resolveTeamId(ref: string): Promise<string> {
    const raw = ref?.trim();

    if (!raw) {
      throw new NotFoundException('Team not found');
    }

    const team = await this.prisma.team.findFirst({
      where: this.teamRefWhere(raw),
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team.id;
  }

  /**
   * Assert that the user is an ACTIVE member of the referenced team, optionally
   * with a specific role, and return the resolved access context.
   *
   * A single query: a non-member cannot tell "team does not exist" from "not
   * your team" — both are a plain 403.
   */
  async requireMembership(
    teamRef: string,
    userId: string,
    requiredRole?: Role,
  ): Promise<TeamAccess> {
    const raw = teamRef?.trim();

    if (!raw) {
      throw new ForbiddenException('Not a member of this team');
    }

    const member = await this.prisma.member.findFirst({
      where: {
        userId,
        status: Status.ACTIVE,
        team: this.teamRefWhere(raw),
      },
      select: { id: true, role: true, teamId: true },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this team');
    }

    if (requiredRole && member.role !== requiredRole) {
      throw new ForbiddenException('Insufficient permissions for this team');
    }

    return { teamId: member.teamId, memberId: member.id, role: member.role };
  }

  /**
   * Matches a team by any of its references. id and code are matched as
   * entered; shortId / routeKey / slug are lowercased, matching how the rest
   * of the app stores and generates them.
   */
  private teamRefWhere(raw: string): Prisma.TeamWhereInput {
    const lower = raw.toLowerCase();

    return {
      OR: [
        { id: raw },
        { shortId: lower },
        { routeKey: lower },
        { slug: lower },
        { code: raw },
      ],
    };
  }
}
