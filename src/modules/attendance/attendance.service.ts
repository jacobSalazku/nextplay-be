import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { TeamAccess } from '../auth/team-access.service';
import {
  GetAttendanceByActivitiesInput,
  PlayerActivityAttendanceInput,
} from './dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendance(input: GetAttendanceByActivitiesInput, teamId: string) {
    return this.prisma.playerActivityAttendance.findFirst({
      where: {
        activityId: input.activityId,
        memberId: input.memberId,
        activity: { teamId },
        member: { teamId },
      },
    });
  }

  async submit(input: PlayerActivityAttendanceInput, team: TeamAccess) {
    // A player may only set their own attendance; a coach may set anyone's.
    if (team.role !== Role.COACH && team.memberId !== input.memberId) {
      throw new ForbiddenException('You can only change your own attendance.');
    }

    const [activity, member] = await Promise.all([
      this.prisma.activity.findFirst({
        where: { id: input.activityId, teamId: team.teamId },
        select: { id: true },
      }),
      this.prisma.member.findFirst({
        where: { id: input.memberId, teamId: team.teamId },
        select: { id: true },
      }),
    ]);

    if (!activity) {
      throw new NotFoundException('Activity not found for this team.');
    }
    if (!member) {
      throw new NotFoundException('Member not found for this team.');
    }

    return this.prisma.playerActivityAttendance.upsert({
      where: {
        activityId_memberId: {
          activityId: input.activityId,
          memberId: input.memberId,
        },
      },
      update: {
        attendanceStatus: input.attendanceStatus,
        reason: input.reason,
      },
      create: {
        activityId: input.activityId,
        memberId: input.memberId,
        attendanceStatus: input.attendanceStatus,
        reason: input.reason,
      },
    });
  }
}
