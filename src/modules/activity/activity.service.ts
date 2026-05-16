import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  Activity as PrismaActivity,
  Status,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  ActivityBuilder,
  ActivityTypes,
  UpdateActivityTypes,
} from './activity.builder';
import { Activity as ActivityModel } from './activity.model';
import { GetActivityInput } from './dto/get';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly builder: ActivityBuilder,
  ) {}

  async createActivity(input: ActivityTypes): Promise<PrismaActivity> {
    return await this.builder.create(input);
  }

  async updateActivity(input: UpdateActivityTypes): Promise<PrismaActivity> {
    return await this.builder.update(input.id, input);
  }

  async deleteActivity(id: string): Promise<PrismaActivity> {
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
            activityId: true,
            memberId: true,
            attendanceStatus: true,
            reason: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    return activities;
  }

  async getActivity(
    input: GetActivityInput,
    userId: string,
  ): Promise<ActivityModel> {
    const teamShortId = this.extractTeamShortId(input.teamRef);

    const team = await this.prisma.team.findUnique({
      where: { shortId: teamShortId },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    const membership = await this.prisma.member.findFirst({
      where: {
        teamId: team.id,
        userId,
        status: Status.ACTIVE,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this team.');
    }

    const activity = await this.prisma.activity.findFirst({
      where: {
        id: input.activityId,
        teamId: team.id,
        type: ActivityType.GAME,
      },
      select: {
        id: true,
        title: true,
        date: true,
        time: true,
        duration: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        teamId: true,
        attendees: {
          select: {
            id: true,
            activityId: true,
            memberId: true,
            attendanceStatus: true,
            reason: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        game: {
          select: {
            activityId: true,
            location: true,
            opponentStatlines: {
              select: {
                gameId: true,
                name: true,
                fieldGoalsMade: true,
                threePointersMade: true,
                freeThrowsMade: true,
              },
            },
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    return {
      ...activity,
      game: activity.game
        ? {
            activityId: activity.game.activityId,
            location: activity.game.location,
            opponentStatline: activity.game.opponentStatlines
              ? {
                  activityId: activity.game.opponentStatlines.gameId,
                  name: activity.game.opponentStatlines.name,
                  fieldGoalsMade:
                    activity.game.opponentStatlines.fieldGoalsMade,
                  threePointersMade:
                    activity.game.opponentStatlines.threePointersMade,
                  freeThrowsMade:
                    activity.game.opponentStatlines.freeThrowsMade,
                }
              : undefined,
          }
        : undefined,
    };
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
