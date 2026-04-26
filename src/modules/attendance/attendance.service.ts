import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  GetAttendanceByActivitiesInput,
  PlayerActivityAttendanceInput,
} from './dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getAttendance(input: GetAttendanceByActivitiesInput) {
    const attendance = await this.prisma.playerActivityAttendance.findFirst({
      where: {
        id: input.activityId,
        memberId: input.memeberId,
      },
      include: {
        member: {
          include: {
            user: true,
          },
        },
      },
    });
    return attendance;
  }

  async submit(input: PlayerActivityAttendanceInput) {
    const attendance = await this.prisma.playerActivityAttendance.upsert({
      where: {
        activityId_memberId: {
          activityId: input.activityId,
          memberId: input.memeberId,
        },
      },
      update: {
        attendanceStatus: input.attendanceStatus,
        reason: input.reason,
      },
      create: {
        activityId: input.activityId,
        memberId: input.memeberId,
        attendanceStatus: input.attendanceStatus,
        reason: input.reason,
      },
    });
    return attendance;
  }
}
