import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTeamInput, JoinTeamInput, TeamRequestInput } from './dto';
import { TeamGateway } from './team.gateway';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamSocket: TeamGateway,
  ) {}

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

      return team;
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

    return teams;
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
      members: team.members.map((member) => ({
        id: member.id,
        userId: member.userId,
        teamId: member.teamId,
        name: member.user.name,
        image: member.user.image,
      })),
    };
  }

  async requestToJoinTeam(input: JoinTeamInput, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { code: input.teamCode },
      select: { id: true, code: true },
    });

    if (!team) {
      throw new NotFoundException('Invalid teamCode');
    }

    const existing = await this.prisma.member.findUnique({
      where: {
        userId_teamId: {
          userId,
          teamId: team.id,
        },
      },
      select: { id: true, status: true },
    });

    if (existing?.status === Status.ACTIVE) {
      throw new ConflictException('You are already part of this team.');
    }

    if (existing?.status === Status.PENDING) {
      throw new ConflictException('Join request already pending.');
    }

    // Reuse an existing inactive membership instead of creating a duplicate
    // because Member has a unique [userId, teamId] constraint.
    const member =
      existing?.status === Status.INACTIVE
        ? await this.prisma.member.update({
            where: { id: existing.id },
            data: {
              role: Role.PLAYER,
              status: Status.PENDING,
              number: input.number,
              position: input.position,
            },
            select: {
              id: true,
              number: true,
              position: true,
            },
          })
        : await this.prisma.member.create({
            data: {
              userId,
              teamId: team.id,
              role: Role.PLAYER,
              status: Status.PENDING,
              number: input.number,
              position: input.position,
            },
            select: {
              id: true,
              number: true,
              position: true,
            },
          });

    await this.prisma.user.update({
      where: { id: userId },
      data: { hasOnBoarded: true },
    });

    // Notify all subscribed coach clients for this team in realtime.
    this.teamSocket.emitJoinRequest(team.id, {
      teamId: team.id,
      teamCode: team.code,
      userId,
      memberId: member.id,
      number: member.number,
      position: member.position,
      requestedAt: new Date().toISOString(),
    });

    return {
      teamCode: team.code,
      position: member.position ?? undefined,
      number: member.number,
    };
  }

  async acceptTeamRequest(input: TeamRequestInput, teamId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: input.memberId, teamId },
      select: { id: true, teamId: true, status: true },
    });

    if (!member) {
      throw new NotFoundException('Join request not found.');
    }

    if (member.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be approved.');
    }

    const updatedStatus = await this.prisma.member.update({
      where: { id: member.id },
      data: { status: Status.ACTIVE },
      select: { id: true, teamId: true, status: true },
    });

    this.teamSocket.emitJoinRequestApproved(updatedStatus.teamId, {
      memberId: updatedStatus.id,
      teamId: updatedStatus.teamId,
      status: updatedStatus.status,
    });

    return {
      memberId: updatedStatus.id,
      teamId: updatedStatus.teamId,
      status: updatedStatus.status,
    };
  }

  async rejectJoinRequest(input: { memberId: string }, userId: string) {
    const member = await this.prisma.member.findUnique({
      where: { id: input.memberId },
      select: { id: true, teamId: true, status: true },
    });

    if (!member) {
      throw new NotFoundException('Join request not found.');
    }

    const coachMembership = await this.getMembership(userId, member.teamId);

    if (
      !coachMembership ||
      coachMembership.status !== Status.ACTIVE ||
      coachMembership.role !== Role.COACH
    ) {
      throw new ForbiddenException('Only an active coach can reject requests.');
    }

    if (member.status !== Status.PENDING) {
      throw new ConflictException('Only pending requests can be rejected.');
    }

    const updated = await this.prisma.member.update({
      where: { id: member.id },
      data: { status: Status.INACTIVE },
      select: { id: true, teamId: true, status: true },
    });

    this.teamSocket.emitJoinRequestRejected(updated.teamId, {
      memberId: updated.id,
      teamId: updated.teamId,
      status: updated.status,
    });

    return {
      memberId: updated.id,
      teamId: updated.teamId,
      status: updated.status,
    };
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
}
