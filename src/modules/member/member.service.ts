import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AttendanceStatus, Role, Status } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';
import { ActiveAttendedMembersInput, GetMemberProfileInput } from './dto';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  async getMemberProfile(input: GetMemberProfileInput) {
    const teamShortId = this.extractTeamShortId(input.teamShortId);

    const team = await this.prisma.team.findUnique({
      where: { shortId: teamShortId },
      select: { id: true },
    });

    if (!team) {
      throw new ForbiddenException('Team not found');
    }

    const member = await this.prisma.member.findFirst({
      where: { teamId: team.id, userId: input.id },
      select: {
        id: true,
        userId: true,
        teamId: true,
        status: true,
        role: true,
        number: true,
        position: true,
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
        attendances: {
          select: {
            id: true,
            activityId: true,
            memberId: true,
            attendanceStatus: true,
            reason: true,
            createdAt: true,
            updatedAt: true,
            activity: {
              select: {
                id: true,
                title: true,
                time: true,
                date: true,
              },
            },
          },
        },
      },
    });

    if (!member || member.userId !== input.id) {
      throw new ForbiddenException('Not a member of this team');
    }

    return {
      ...member,
      name: member.user.name,
    };
  }

  async getActiveMembers(routeKey: string) {
    const teamShortId = this.extractTeamShortId(routeKey);

    const team = await this.prisma.team.findUnique({
      where: { shortId: teamShortId },
      select: {
        id: true,
        members: {
          where: { status: 'ACTIVE', role: 'PLAYER' },
          include: {
            attendances: {
              select: {
                id: true,
                activityId: true,
                memberId: true,
                attendanceStatus: true,
                reason: true,
                createdAt: true,
                updatedAt: true,
                activity: {
                  select: {
                    id: true,
                    title: true,
                    time: true,
                    date: true,
                  },
                },
              },
            },

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
      throw new ForbiddenException('Team ID is required');
    }

    const members = team?.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      name: member.user.name,
      role: member.role,
      status: member.status,
      number: member.number,
      position: member.position,
      attendances: member.attendances,
      user: {
        id: member.user.id,
        name: member.user.name,
        image: member.user.image,
        email: member.user.email,
        dateOfBirth: member.user.dateOfBirth,
        phone: member.user.phone,
        height: member.user.height,
        weight: member.user.weight,
        dominantHand: member.user.dominantHand,
        hasOnBoarded: member.user.hasOnBoarded,
      },
    }));

    return members;
  }

  async getPendingMembers(routeKey: string) {
    const members = await this.prisma.member.findMany({
      where: {
        team: {
          routeKey: routeKey,
        },
        role: Role.PLAYER,
        status: Status.PENDING,
      },
      select: {
        id: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return members.map((member) => ({
      id: member.id,
      name: member.user.name,
      email: member.user.email,
    }));
  }

  async getActiveAttendedMembers(input: ActiveAttendedMembersInput) {
    const teamShortId = this.extractTeamShortId(input.routeKey);

    const team = await this.prisma.team.findUnique({
      where: { shortId: teamShortId },
      select: {
        id: true,
        members: {
          where: {
            status: Status.ACTIVE,
            role: Role.PLAYER,
            attendances: {
              some: {
                activityId: input.activityId,
                attendanceStatus: AttendanceStatus.ATTENDING,
              },
            },
          },
          include: {
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
            statlines: {
              where: {
                gameId: input.activityId,
              },
              select: {
                id: true,
                gameId: true,
                fieldGoalsMade: true,
                fieldGoalsMissed: true,
                threePointersMade: true,
                threePointersMissed: true,
                freeThrows: true,
                freeThrowsMissed: true,
                assists: true,
                steals: true,
                turnovers: true,
                offensiveRebounds: true,
                defensiveRebounds: true,
                blocks: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    return team.members.map((member) => ({
      id: member.id,
      userId: member.userId,
      teamId: member.teamId,
      name: member.user.name,
      role: member.role,
      status: member.status,
      number: member.number,
      position: member.position,
      user: {
        id: member.user.id,
        name: member.user.name,
        image: member.user.image,
        email: member.user.email,
        dateOfBirth: member.user.dateOfBirth,
        phone: member.user.phone,
        height: member.user.height,
        weight: member.user.weight,
        dominantHand: member.user.dominantHand,
        hasOnBoarded: member.user.hasOnBoarded,
      },
      statlines: member.statlines.map((statline) => ({
        id: statline.id,
        activityId: statline.gameId,
        fieldGoalsMade: statline.fieldGoalsMade,
        fieldGoalsMissed: statline.fieldGoalsMissed,
        threePointersMade: statline.threePointersMade,
        threePointersMissed: statline.threePointersMissed,
        freeThrows: statline.freeThrows,
        missedFreeThrows: statline.freeThrowsMissed,
        assists: statline.assists,
        steals: statline.steals,
        turnovers: statline.turnovers,
        offensiveRebounds: statline.offensiveRebounds,
        defensiveRebounds: statline.defensiveRebounds,
        blocks: statline.blocks,
      })),
    }));
  }

  async deleteMember(id: string) {
    await this.prisma.statline.deleteMany({
      where: { memberId: id },
    });

    await this.prisma.member.delete({
      where: { id: id },
    });

    return true;
  }

  private extractTeamShortId(routeKey: string): string {
    const normalizedRouteKey = routeKey.trim().toLowerCase();
    const segments = normalizedRouteKey.split('-');
    const possibleShortId = segments.at(-1) ?? normalizedRouteKey;
    const validShortIdPattern = /^[a-z0-9]{6,12}$/;

    if (!validShortIdPattern.test(possibleShortId)) {
      throw new BadRequestException('Invalid team reference');
    }

    return possibleShortId;
  }
}
