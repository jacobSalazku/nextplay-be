import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ActivityType, Prisma, Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreatePracticePreparationInput,
  DeletePracticePreparationInput,
  GetPracticePreparationByIdInput,
  GetPracticePreparationsInput,
} from './dto';

const practicePreparationSelect = {
  id: true,
  name: true,
  focus: true,
  notes: true,
  practiceId: true,
  teamId: true,
  createdAt: true,
  updatedAt: true,
  practice: {
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

type PracticePreparationRecord = Prisma.PracticePreparationGetPayload<{
  select: typeof practicePreparationSelect;
}>;

@Injectable()
export class PracticePreparationService {
  constructor(private readonly prisma: PrismaService) {}

  async createPracticePreparation(
    input: CreatePracticePreparationInput,
    userId: string,
  ) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId, Role.COACH);

    const activity = await this.prisma.activity.findFirst({
      where: {
        id: input.activityId,
        teamId: team.id,
        type: ActivityType.PRACTICE,
      },
      select: { id: true },
    });

    if (!activity) {
      throw new NotFoundException('Practice activity not found for this team.');
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

    const preparation = await this.prisma.practicePreparation.create({
      data: {
        teamId: team.id,
        name: input.name,
        focus: input.focus,
        notes: input.notes,
        practiceId: input.activityId,
        plays: {
          connect: requestedPlayIds.map((id) => ({ id })),
        },
      },
      select: practicePreparationSelect,
    });

    return this.mapPracticePreparation(preparation);
  }

  async getPracticePreparations(
    input: GetPracticePreparationsInput,
    userId: string,
  ) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId);

    const preparations = await this.prisma.practicePreparation.findMany({
      where: { teamId: team.id },
      select: practicePreparationSelect,
      orderBy: { createdAt: 'desc' },
    });

    return preparations.map((preparation) =>
      this.mapPracticePreparation(preparation),
    );
  }

  async getPracticePreparationById(
    input: GetPracticePreparationByIdInput,
    userId: string,
  ) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId);

    const preparation = await this.prisma.practicePreparation.findFirst({
      where: {
        id: input.id,
        teamId: team.id,
      },
      select: practicePreparationSelect,
    });

    if (!preparation) {
      return null;
    }

    return this.mapPracticePreparation(preparation);
  }

  async deletePracticePreparation(
    input: DeletePracticePreparationInput,
    userId: string,
  ) {
    const team = await this.resolveTeam(input.teamRef);
    await this.assertActiveMembership(team.id, userId, Role.COACH);

    const existing = await this.prisma.practicePreparation.findFirst({
      where: {
        id: input.practicePreparationId,
        teamId: team.id,
      },
      select: practicePreparationSelect,
    });

    if (!existing) {
      throw new NotFoundException('Practice preparation not found.');
    }

    await this.prisma.practicePreparation.delete({
      where: { id: existing.id },
    });

    return this.mapPracticePreparation(existing);
  }

  private async resolveTeam(teamRef: string): Promise<{ id: string }> {
    const normalizedTeamRef = teamRef.trim();
    const lowerRef = normalizedTeamRef.toLowerCase();
    const shortIdFromRoute = lowerRef.split('-').at(-1) ?? lowerRef;

    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { id: normalizedTeamRef },
          { routeKey: normalizedTeamRef },
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
  ): Promise<void> {
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

  private mapPracticePreparation(record: PracticePreparationRecord) {
    return {
      id: record.id,
      name: record.name,
      focus: record.focus,
      notes: record.notes,
      activityId: record.practiceId,
      teamId: record.teamId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      activity: record.practice?.activity
        ? {
            id: record.practice.activity.id,
            title: record.practice.activity.title,
            date: record.practice.activity.date,
            time: record.practice.activity.time,
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
