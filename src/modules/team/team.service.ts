import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  AcceptTeamInviteInput,
  AcceptTeamInviteResponse,
  AcceptTeamInviteStatus,
  CreateTeamInput,
  CreateTeamInviteInput,
} from './dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(input: CreateTeamInput, creatorId: string) {
    const code = await this.generateUniqueCode();
    const shortId = await this.generateUniqueShortId();
    const slug = this.slugify(input.name);
    const routeKey = `${slug}-${shortId}`;

    return await this.prisma.$transaction(async (prisma) => {
      const team = await prisma.team.create({
        data: {
          name: input.name,
          image: input.image,
          ageGroup: input.ageGroup,
          code,
          shortId,
          slug,
          routeKey,
          creatorId,
          members: {
            create: {
              userId: creatorId,
              role: Role.COACH,
              status: Status.ACTIVE,
            },
          },
        },
      });

      await prisma.user.update({
        where: { id: creatorId },
        data: { hasOnBoarded: true },
      });

      return { ...team, routeKey: team.routeKey ?? routeKey };
    });
  }

  async getTeams(userId: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId: userId,
            status: Status.ACTIVE,
          },
        },
      },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        shortId: true,
        ageGroup: true,
        image: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        activities: {
          select: {
            id: true,
            title: true,
            time: true,
            type: true,
            date: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { date: 'desc' },
        },
        members: {
          select: {
            userId: true,
            role: true,
            status: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!teams) {
      throw new NotFoundException('Teams not found');
    }

    return teams;
  }

  async getTeamsForDashboard(userId: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        members: {
          some: {
            userId,
            status: Status.ACTIVE,
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        shortId: true,
        routeKey: true,
        ageGroup: true,
        members: {
          select: {
            id: true,
          },
        },
        activities: {
          select: {
            id: true,
            type: true,
            title: true,
            date: true,
            time: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    });

    return teams.map((team) => ({
      ...team,
      routeKey: team.routeKey ?? team.shortId,
    }));
  }

  async getTeam(routeKey: string) {
    const team = await this.prisma.team.findUnique({
      where: {
        routeKey: routeKey,
      },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        shortId: true,
        routeKey: true,
        image: true,
        ageGroup: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          where: {
            role: Role.PLAYER,
            status: Status.ACTIVE,
          },
          select: {
            id: true,
            userId: true,
            teamId: true,
            number: true,
            position: true,
            role: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
                email: true,
                dateOfBirth: true,
                phone: true,
                height: true,
                weight: true,
                dominantHand: true,
                hasOnBoarded: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team is not found');
    }

    return {
      ...team,
      routeKey: team.routeKey ?? team.shortId,
      members: team.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        teamId: member.teamId,
        name: member.user.name,
        number: member.number,
        position: member.position,
        image: member.user.image,
        user: {
          ...member.user,
        },
      })),
    };
  }

  async getTeamActivities(routeKey: string) {
    const team = await this.prisma.team.findUnique({
      where: {
        routeKey: routeKey,
      },
      select: {
        id: true,
        name: true,
        code: true,
        slug: true,
        shortId: true,
        routeKey: true,
        image: true,
        ageGroup: true,
        creatorId: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            userId: true,
            teamId: true,
            role: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
        activities: {
          select: {
            id: true,
            title: true,
            time: true,
            type: true,
            duration: true,
            attendees: true,
            date: true,
            createdAt: true,
            updatedAt: true,
            teamId: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team is not found');
    }

    return {
      ...team,
      routeKey: team.routeKey ?? team.shortId,
      members: team.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        teamId: member.teamId,
        name: member.user.name,
        image: member.user.image,
      })),
    };
  }

  async createTeamInvite(input: CreateTeamInviteInput, userId: string) {
    const rawRouteKey = input.routeKey.trim();
    const routeKey = rawRouteKey.toLowerCase();

    // Accept the public routeKey first, but keep id/shortId/slug support so
    // older internal callers do not break while the frontend migrates.
    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { id: rawRouteKey },
          { routeKey },
          { shortId: routeKey },
          { slug: routeKey },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    const membership = await this.getMembership(userId, team.id);

    // The guard protects the resolver, but the service owns the business rule:
    // only an active coach of this exact team may create an invite.
    if (
      !membership ||
      membership.status !== Status.ACTIVE ||
      membership.role !== Role.COACH
    ) {
      throw new ForbiddenException(
        'Only an active coach can create team invites.',
      );
    }

    const expiresAt = input.expiresAt
      ? new Date(input.expiresAt)
      : this.getDefaultInviteExpiry();

    // Avoid creating invites that are already invalid or impossible to compare.
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) {
      throw new BadRequestException('Invite expiry must be in the future.');
    }

    const token = await this.generateUniqueInviteToken();
    const invite = await this.prisma.teamInvite.create({
      data: {
        token,
        teamId: team.id,
        expiresAt,
        maxUses: 1,
        createdBy: userId,
      },
      select: {
        id: true,
        token: true,
        teamId: true,
        expiresAt: true,
        maxUses: true,
        usedCount: true,
        revokedAt: true,
        createdBy: true,
      },
    });

    return {
      ...invite,
      inviteLink: this.buildInviteLink(invite.token),
    };
  }

  async acceptTeamInvite(
    input: AcceptTeamInviteInput,
    userId: string,
  ): Promise<AcceptTeamInviteResponse> {
    const token = input.token.trim();

    if (!token) {
      throw new NotFoundException('Invite not found.');
    }

    return this.prisma.$transaction(async (prisma) => {
      const invite = await prisma.teamInvite.findUnique({
        where: { token },
        select: {
          id: true,
          teamId: true,
          expiresAt: true,
          maxUses: true,
          usedCount: true,
          revokedAt: true,
          team: {
            select: {
              routeKey: true,
            },
          },
        },
      });

      if (!invite) {
        throw new NotFoundException('Invite not found.');
      }

      const existingMembership = await prisma.member.findUnique({
        where: {
          userId_teamId: {
            userId,
            teamId: invite.teamId,
          },
        },
        select: {
          id: true,
          status: true,
        },
      });

      const baseResponse = {
        teamId: invite.teamId,
        routeKey: invite.team.routeKey,
        memberId: existingMembership?.id,
      };

      // If the user is already active, do not consume the invite again.
      if (existingMembership?.status === Status.ACTIVE) {
        return {
          ...baseResponse,
          status: AcceptTeamInviteStatus.ALREADY_JOINED,
        };
      }

      const now = new Date();

      if (invite.revokedAt) {
        return {
          ...baseResponse,
          status: AcceptTeamInviteStatus.REVOKED,
        };
      }

      if (invite.expiresAt <= now) {
        return {
          ...baseResponse,
          status: AcceptTeamInviteStatus.EXPIRED,
        };
      }

      if (invite.usedCount >= invite.maxUses) {
        return {
          ...baseResponse,
          status: AcceptTeamInviteStatus.USED,
        };
      }

      // Claim the invite and guard against race conditions where two requests
      // try to consume the same single-use invite at the same time.
      const claimedInvite = await prisma.teamInvite.updateMany({
        where: {
          id: invite.id,
          revokedAt: null,
          expiresAt: {
            gt: now,
          },
          usedCount: {
            lt: invite.maxUses,
          },
        },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      if (claimedInvite.count === 0) {
        const latestInvite = await prisma.teamInvite.findUnique({
          where: { id: invite.id },
          select: {
            expiresAt: true,
            revokedAt: true,
          },
        });

        if (latestInvite?.revokedAt) {
          return {
            ...baseResponse,
            status: AcceptTeamInviteStatus.REVOKED,
          };
        }

        if (!latestInvite || latestInvite.expiresAt <= new Date()) {
          return {
            ...baseResponse,
            status: AcceptTeamInviteStatus.EXPIRED,
          };
        }

        return {
          ...baseResponse,
          status: AcceptTeamInviteStatus.USED,
        };
      }

      const member = existingMembership
        ? await prisma.member.update({
            where: {
              id: existingMembership.id,
            },
            data: {
              role: Role.PLAYER,
              status: Status.ACTIVE,
            },
            select: {
              id: true,
            },
          })
        : await prisma.member.create({
            data: {
              userId,
              teamId: invite.teamId,
              role: Role.PLAYER,
              status: Status.ACTIVE,
            },
            select: {
              id: true,
            },
          });

      await prisma.user.update({
        where: { id: userId },
        data: { hasOnBoarded: true },
      });

      return {
        teamId: invite.teamId,
        routeKey: invite.team.routeKey,
        memberId: member.id,
        status: AcceptTeamInviteStatus.SUCCESS,
      };
    });
  }

  async getMembership(userId: string, teamId: string) {
    return this.prisma.member.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
      select: {
        status: true,
        role: true,
      },
    });
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      const existingTeam = await this.prisma.team.findUnique({
        where: { code },
        select: { id: true },
      });

      if (!existingTeam) {
        return code;
      }
    }

    throw new Error('Unable to generate a unique team code');
  }

  private slugify(value: string): string {
    const slug = value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return slug.length > 0 ? slug : 'team';
  }

  private generateShortId(length = 8): string {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = randomBytes(length);
    let shortId = '';

    for (let index = 0; index < length; index += 1) {
      shortId += alphabet[bytes[index] % alphabet.length];
    }

    return shortId;
  }

  private async generateUniqueShortId(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const shortId = this.generateShortId();
      const existingTeam = await this.prisma.team.findUnique({
        where: { shortId },
        select: { id: true },
      });

      if (!existingTeam) {
        return shortId;
      }
    }

    throw new Error('Unable to generate a unique team shortId');
  }

  private getDefaultInviteExpiry(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    return expiresAt;
  }

  private generateInviteToken(byteLength = 32): string {
    return randomBytes(byteLength).toString('base64url');
  }

  private async generateUniqueInviteToken(): Promise<string> {
    // Token collisions are extremely unlikely, but we still verify uniqueness
    // because the token is the only thing users receive in the invite link.
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const token = this.generateInviteToken();
      const existingInvite = await this.prisma.teamInvite.findUnique({
        where: { token },
        select: { id: true },
      });

      if (!existingInvite) {
        return token;
      }
    }

    throw new Error('Unable to generate a unique invite token');
  }

  private buildInviteLink(token: string): string {
    // Keep the backend environment-driven so local, preview and production
    // deployments can all return a complete frontend URL.
    const baseUrl = (
      process.env.FRONTEND_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      'http://localhost:3000'
    ).replace(/\/+$/, '');

    return `${baseUrl}/join-team?invite=${encodeURIComponent(token)}`;
  }
}
