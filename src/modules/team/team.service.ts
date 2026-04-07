import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ApproveJoinRequestInput, CreateTeamInput, JoinTeamInput } from './dto';
import { TeamGateway } from './team.gateway';

@Injectable()
export class TeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamSocket: TeamGateway,
  ) {}

  async createTeam(input: CreateTeamInput, creatorId: string) {
    const code = await this.generateUniqueCode();

    return await this.prisma.$transaction(async (prisma) => {
      const team = await prisma.team.create({
        data: {
          name: input.name,
          image: input.image,
          ageGroup: input.ageGroup,
          code,
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

  async getTeam(teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
      },
      select: {
        id: true,
        name: true,
        code: true,
        image: true,
        ageGroup: true,
        members: {
          select: {
            userId: true,
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
          orderBy: { date: 'desc' },
          select: {
            id: true,
            title: true,
            duration: true,
            date: true,
            time: true,
            type: true,
            attendees: {
              select: {
                id: true,
                activityId: true,
                attendanceStatus: true,
                Member: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team isnot found');
    }

    return team;
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

  async approveJoinRequest(input: ApproveJoinRequestInput, userId: string) {
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
      throw new ForbiddenException(
        'Only an active coach can approve requests.',
      );
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
}
