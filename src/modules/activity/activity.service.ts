import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityType,
  Prisma,
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
import { GetActivitiesInput, GetActivityInput } from './dto/get';

const activitySelect = {
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
  practice: {
    select: {
      activityId: true,
      facility: true,
      practicetype: true,
    },
  },
} as const;

type ActivityWithRelations = Prisma.ActivityGetPayload<{
  select: typeof activitySelect;
}>;

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
    await this.assertGameOrPracticeIsEditable(input.id);

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
    const team = await this.resolveTeamByRef(input.routeKey);
    await this.assertActiveMembership(team.id, userId);

    const activity = await this.prisma.activity.findFirst({
      where: {
        id: input.activityId,
        teamId: team.id,
        type: ActivityType.GAME,
      },
      select: activitySelect,
    });

    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    return this.mapActivity(activity);
  }

  async getGames(
    input: GetActivitiesInput,
    userId: string,
  ): Promise<ActivityModel[]> {
    const team = await this.resolveTeamByRef(input.routeKey);
    await this.assertActiveMembership(team.id, userId);
    const startOfToday = this.getStartOfToday();

    const activities = await this.prisma.activity.findMany({
      where: {
        teamId: team.id,
        type: ActivityType.GAME,
        date: { gte: startOfToday },
      },
      orderBy: { date: 'asc' },
      select: activitySelect,
    });

    return activities.map((activity) => this.mapActivity(activity));
  }

  async getPractices(
    input: GetActivitiesInput,
    userId: string,
  ): Promise<ActivityModel[]> {
    const team = await this.resolveTeamByRef(input.routeKey);
    await this.assertActiveMembership(team.id, userId);
    const startOfToday = this.getStartOfToday();

    const activities = await this.prisma.activity.findMany({
      where: {
        teamId: team.id,
        type: ActivityType.PRACTICE,
        date: { gte: startOfToday },
      },
      orderBy: { date: 'asc' },
      select: activitySelect,
    });

    return activities.map((activity) => this.mapActivity(activity));
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

  private async resolveTeamByRef(routeKey: string): Promise<{ id: string }> {
    const teamShortId = this.extractTeamShortId(routeKey);

    const team = await this.prisma.team.findUnique({
      where: { shortId: teamShortId },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found.');
    }

    return team;
  }

  private async assertActiveMembership(
    teamId: string,
    userId: string,
  ): Promise<void> {
    const membership = await this.prisma.member.findFirst({
      where: {
        teamId,
        userId,
        status: Status.ACTIVE,
      },
      select: { id: true },
    });

    if (!membership) {
      throw new ForbiddenException('Not a member of this team.');
    }
  }

  private getStartOfToday(): Date {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }

  private mapActivity(activity: ActivityWithRelations): ActivityModel {
    return {
      ...activity,
      game: activity.game
        ? {
            id: activity.id,
            title: activity.title,
            date: activity.date,
            time: activity.time,
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
      practice: activity.practice
        ? {
            id: activity.id,
            title: activity.title,
            date: activity.date,
            time: activity.time,
            activityId: activity.practice.activityId,
            facility: activity.practice.facility,
            practicetype: activity.practice.practicetype,
          }
        : undefined,
    };
  }

  private async assertGameOrPracticeIsEditable(
    activityId: string,
  ): Promise<void> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        date: true,
        type: true,
      },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found.');
    }

    if (
      activity.type !== ActivityType.GAME &&
      activity.type !== ActivityType.PRACTICE
    ) {
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activityDay = new Date(activity.date);
    activityDay.setHours(0, 0, 0, 0);

    if (activityDay < today) {
      throw new ForbiddenException(
        'Past games and practices cannot be edited.',
      );
    }
  }
}
