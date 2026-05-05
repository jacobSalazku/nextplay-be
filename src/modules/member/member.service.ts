import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Role, Status } from '@prisma/client';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class MemberService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveMembers(teamRef: string) {
    const teamShortId = this.extractTeamShortId(teamRef);

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

  async getPendingMembers(teamRef: string) {
    const members = await this.prisma.member.findMany({
      where: {
        team: {
          routeKey: teamRef,
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
  async deleteMember(id: string) {
    await this.prisma.statline.deleteMany({
      where: { memberId: id },
    });

    await this.prisma.member.delete({
      where: { id: id },
    });

    return true;
  }

  private extractTeamShortId(teamRef: string): string {
    const normalizedTeamRef = teamRef.trim().toLowerCase();
    const segments = normalizedTeamRef.split('-');
    const possibleShortId = segments.at(-1) ?? normalizedTeamRef;
    const validShortIdPattern = /^[a-z0-9]{6,12}$/;

    if (!validShortIdPattern.test(possibleShortId)) {
      throw new BadRequestException('Invalid team reference');
    }

    return possibleShortId;
  }
}
