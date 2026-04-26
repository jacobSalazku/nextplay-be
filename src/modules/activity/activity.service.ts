import { Injectable } from '@nestjs/common';
import { Activity } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ActivityBuilder,
  ActivityTypes,
  UpdateActivityTypes,
} from './activity.builder';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly builder: ActivityBuilder,
  ) {}

  async createActivity(input: ActivityTypes): Promise<Activity> {
    return await this.builder.create(input);
  }

  async updateActivity(input: UpdateActivityTypes): Promise<Activity> {
    return await this.builder.update(input.id, input);
  }

  async deleteActivity(id: string): Promise<Activity> {
    const deletedGame = await this.prisma.activity.delete({
      where: { id: id },
    });
    return deletedGame;
  }

  async getActivities(teamShortId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        team: {
          shortId: teamShortId,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        duration: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        attendees: {
          select: {
            id: true,
            memberId: true,
            attendanceStatus: true,
            reason: true,
          },
        },
      },
    });

    return activities;
  }
}
