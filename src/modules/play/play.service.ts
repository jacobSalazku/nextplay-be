import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePlayInput, DeletePlayInput } from './dto';

const playSelect = {
  id: true,
  name: true,
  category: true,
  description: true,
  canvas: true,
  createdAt: true,
  updatedAt: true,
  team: {
    select: {
      routeKey: true,
      shortId: true,
    },
  },
} as const;

type PlayWithTeam = Prisma.PlayGetPayload<{
  select: typeof playSelect;
}>;

type PlayResponse = {
  id: string;
  teamRef: string;
  name: string;
  category: Category;
  description: string;
  canvas: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PlayService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlays(teamRef: string): Promise<PlayResponse[]> {
    const team = await this.resolveTeam(teamRef);

    const plays = await this.prisma.play.findMany({
      where: {
        teamId: team.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: playSelect,
    });

    return plays.map((play) => this.mapPlay(play));
  }

  async getPlayById(playid: string): Promise<PlayResponse | null> {
    const play = await this.prisma.play.findUnique({
      where: { id: playid },
      select: playSelect,
    });

    if (!play) {
      return null;
    }

    return this.mapPlay(play);
  }

  async createPlay(input: CreatePlayInput): Promise<PlayResponse> {
    const team = await this.resolveTeam(input.teamRef);

    const play = await this.prisma.play.create({
      data: {
        teamId: team.id,
        name: input.name,
        description: input.description,
        category: input.category,
        canvas: input.canvas,
      },
      select: playSelect,
    });

    return this.mapPlay(play);
  }

  async deletePlay(input: DeletePlayInput): Promise<boolean> {
    const team = await this.resolveTeam(input.teamRef);

    const deleted = await this.prisma.play.deleteMany({
      where: {
        id: input.id,
        teamId: team.id,
      },
    });

    return deleted.count > 0;
  }

  private async resolveTeam(teamRef: string): Promise<{ id: string }> {
    const normalizedTeamRef = teamRef.trim();

    if (!normalizedTeamRef) {
      throw new BadRequestException('Team reference is required');
    }

    const lowerRef = normalizedTeamRef.toLowerCase();
    const shortIdFromRoute = lowerRef.split('-').at(-1) ?? lowerRef;

    const team = await this.prisma.team.findFirst({
      where: {
        OR: [
          { routeKey: normalizedTeamRef },
          { routeKey: lowerRef },
          { shortId: lowerRef },
          { shortId: shortIdFromRoute },
        ],
      },
      select: { id: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    return team;
  }

  private mapPlay(play: PlayWithTeam): PlayResponse {
    return {
      id: play.id,
      teamRef: play.team.routeKey ?? play.team.shortId,
      name: play.name,
      category: play.category,
      description: play.description,
      canvas: play.canvas,
      createdAt: play.createdAt,
      updatedAt: play.updatedAt,
    };
  }
}
