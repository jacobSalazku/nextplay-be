import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, Status } from '@prisma/client';
import {
  CreateGamePlanInput,
  DeleteGamePlanInput,
  GetGamePlanByIdInput,
  GetGamePlansInput,
} from './dto';
import { PrismaService } from 'src/prisma/prisma.service';

const gamePlanSelect = {
  id: true,
  title: true,
  opponent: true,
  notes: true,
  gameID: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
  game: {
    select: {
      activity: {
        select: {
          id: true,
          title: true,
          date: true,
          time: true,
        },
      },
    },
  },
  plays: {
    select: {
      id: true,
      name: true,
      category: true,
    },
  },
} as const;

type GamePlanRecord = Prisma.GamePlanGetPayload<{
  select: typeof gamePlanSelect;
}>;

@Injectable()
export class GameplanService {
  constructor(private readonly prisma: PrismaService) {}

  async createGamePlan(input: CreateGamePlanInput, userId: string) {
    const team = await this.resolveTeam(input.routeKey);
    await this.assertActiveMembership(team.id, userId, Role.COACH);

    const activity = await this.prisma.activity.findFirst({
      where: {
        id: input.activityId,
        teamId: team.id,
      },
      select: { id: true },
    });

    if (!activity) {
      throw new NotFoundException('Activity not found for this team.');
    }

    const requestedPlayIds = [...new Set(input.playsId)];
    if (requestedPlayIds.length > 0) {
      const plays = await this.prisma.play.findMany({
        where: {
          id: { in: requestedPlayIds },
          teamId: team.id,
        },
        select: { id: true },
      });

      if (plays.length !== requestedPlayIds.length) {
        throw new NotFoundException('One or more plays were not found.');
      }
    }

    const gamePlan = await this.prisma.gamePlan.create({
      data: {
        title: input.name,
        opponent: input.opponent,
        notes: input.notes,
        gameID: input.activityId,
        teamId: team.id,
        plays: {
          connect: requestedPlayIds.map((id) => ({ id })),
        },
      },
      select: gamePlanSelect,
    });

    return this.mapGamePlan(gamePlan);
  }

  async getGameplan(input: GetGamePlansInput, userId: string) {
    const team = await this.resolveTeam(input.routeKey);
    await this.assertActiveMembership(team.id, userId);

    const gameplans = await this.prisma.gamePlan.findMany({
      where: { teamId: team.id },
      select: gamePlanSelect,
      orderBy: { createdAt: 'desc' },
    });

    return gameplans.map((gamePlan) => this.mapGamePlan(gamePlan));
  }

  async getGameplanById(input: GetGamePlanByIdInput, userId: string) {
    const team = await this.resolveTeam(input.routeKey);
    await this.assertActiveMembership(team.id, userId);

    const gamePlan = await this.prisma.gamePlan.findFirst({
      where: {
        id: input.id,
        teamId: team.id,
      },
      select: gamePlanSelect,
    });

    if (!gamePlan) {
      return null;
    }

    return this.mapGamePlan(gamePlan);
  }

  async deleteGamePlan(input: DeleteGamePlanInput, userId: string) {
    const team = await this.resolveTeam(input.routeKey);
    await this.assertActiveMembership(team.id, userId, Role.COACH);

    const existing = await this.prisma.gamePlan.findFirst({
      where: {
        id: input.gamePlanId,
        teamId: team.id,
      },
      select: gamePlanSelect,
    });

    if (!existing) {
      throw new NotFoundException('GamePlan not found.');
    }

    await this.prisma.gamePlan.delete({
      where: { id: existing.id },
    });

    return this.mapGamePlan(existing);
  }

  private async resolveTeam(routeKey: string) {
    const normalizedRouteKey = routeKey.trim();
    const lowerRef = normalizedRouteKey.toLowerCase();
    const shortIdFromRoute = lowerRef.split('-').at(-1) ?? lowerRef;

    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { id: normalizedRouteKey },
          { routeKey: normalizedRouteKey },
          { shortId: lowerRef },
          { shortId: shortIdFromRoute },
        ],
      },
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
    requiredRole?: Role,
  ) {
    const member = await this.prisma.member.findFirst({
      where: {
        teamId,
        userId,
        status: Status.ACTIVE,
      },
      select: { role: true },
    });

    if (!member) {
      throw new ForbiddenException('Not an active member of this team.');
    }

    if (requiredRole && member.role !== requiredRole) {
      throw new ForbiddenException('You do not have permission.');
    }
  }

  private mapGamePlan(record: GamePlanRecord) {
    return {
      id: record.id,
      name: record.title,
      opponent: record.opponent,
      notes: record.notes,
      activityId: record.gameID,
      teamId: record.teamId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      activity: record.game?.activity
        ? {
            id: record.game.activity.id,
            title: record.game.activity.title,
            date: record.game.activity.date,
            time: record.game.activity.time,
          }
        : undefined,
      plays: record.plays.map((play) => ({
        id: play.id,
        name: play.name,
        category: play.category,
      })),
    };
  }
}
