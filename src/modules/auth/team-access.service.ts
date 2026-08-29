import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, Status } from '@prisma/client';
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
   * or join code — to the canonical team id.
   */
  async resolveTeamId(ref: string): Promise<string> {
    const raw = ref?.trim();

    if (!raw) {
      throw new NotFoundException('Team not found');
    }

    const lower = raw.toLowerCase();

    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { id: raw },
          { shortId: lower },
          { routeKey: lower },
          { slug: lower },
          { code: raw },
        ],
      },
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
   */
  async requireMembership(
    teamRef: string,
    userId: string,
    requiredRole?: Role,
  ): Promise<TeamAccess> {
    const teamId = await this.resolveTeamId(teamRef);

    const member = await this.prisma.member.findFirst({
      where: { teamId, userId, status: Status.ACTIVE },
      select: { id: true, role: true },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this team');
    }

    if (requiredRole && member.role !== requiredRole) {
      throw new ForbiddenException('Insufficient permissions for this team');
    }

    return { teamId, memberId: member.id, role: member.role };
  }
}
