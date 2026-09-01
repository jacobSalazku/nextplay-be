import { Injectable } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { sanitizeRichText } from 'src/common/sanitize-rich-text';
import { CreatePlayInput } from './dto';

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
  routeKey: string;
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

  async getPlays(teamId: string): Promise<PlayResponse[]> {
    const plays = await this.prisma.play.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
      select: playSelect,
    });

    return plays.map((play) => this.mapPlay(play));
  }

  async getPlayById(
    playId: string,
    teamId: string,
  ): Promise<PlayResponse | null> {
    const play = await this.prisma.play.findFirst({
      where: { id: playId, teamId },
      select: playSelect,
    });

    return play ? this.mapPlay(play) : null;
  }

  async createPlay(
    input: CreatePlayInput,
    teamId: string,
  ): Promise<PlayResponse> {
    const play = await this.prisma.play.create({
      data: {
        teamId,
        name: input.name,
        description: sanitizeRichText(input.description),
        category: input.category,
        canvas: input.canvas,
      },
      select: playSelect,
    });

    return this.mapPlay(play);
  }

  async deletePlay(playId: string, teamId: string): Promise<boolean> {
    const deleted = await this.prisma.play.deleteMany({
      where: { id: playId, teamId },
    });

    return deleted.count > 0;
  }

  private mapPlay(play: PlayWithTeam): PlayResponse {
    return {
      id: play.id,
      routeKey: play.team.routeKey ?? play.team.shortId,
      name: play.name,
      category: play.category,
      description: play.description,
      canvas: play.canvas,
      createdAt: play.createdAt,
      updatedAt: play.updatedAt,
    };
  }
}
