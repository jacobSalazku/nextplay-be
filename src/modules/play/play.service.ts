import { BadRequestException, Injectable } from '@nestjs/common';
import { Category, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { sanitizeRichText } from 'src/common/sanitize-rich-text';
import { CreatePlayInput, UpdatePlayInput } from './dto';
import { CourtType, PlayActionType, PlayObjectKind } from './play.enums';
import { FORMATION_PRESETS, FormationPreset } from './formation-presets';
import { MAX_DIAGRAM_BYTES, playDiagramSchema } from './play-diagram.schema';

const playSelect = {
  id: true,
  name: true,
  category: true,
  description: true,
  canvas: true,
  diagram: true,
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
  canvas: string | null;
  diagram: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
};

type EditorConfig = {
  actionTypes: PlayActionType[];
  objectKinds: PlayObjectKind[];
  courts: CourtType[];
  formations: FormationPreset[];
};

function parseDiagram(input: unknown): Prisma.InputJsonValue {
  if (
    Buffer.byteLength(JSON.stringify(input ?? null), 'utf8') > MAX_DIAGRAM_BYTES
  ) {
    throw new BadRequestException('Play diagram is too large');
  }

  const result = playDiagramSchema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(
      result.error.issues[0]?.message ?? 'Invalid play diagram',
    );
  }

  return result.data as unknown as Prisma.InputJsonValue;
}

@Injectable()
export class PlayService {
  constructor(private readonly prisma: PrismaService) {}

  getEditorConfig(): EditorConfig {
    return {
      actionTypes: Object.values(PlayActionType),
      objectKinds: Object.values(PlayObjectKind),
      courts: Object.values(CourtType),
      formations: FORMATION_PRESETS,
    };
  }

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
    if ((input.diagram == null) === (input.canvas == null)) {
      throw new BadRequestException(
        'A play needs exactly one of diagram / canvas',
      );
    }

    const play = await this.prisma.play.create({
      data: {
        teamId,
        name: input.name,
        description: sanitizeRichText(input.description),
        category: input.category,
        canvas: input.canvas ?? null,
        diagram:
          input.diagram != null ? parseDiagram(input.diagram) : undefined,
      },
      select: playSelect,
    });

    return this.mapPlay(play);
  }

  async updatePlay(
    input: UpdatePlayInput,
    teamId: string,
  ): Promise<PlayResponse> {
    const data: Prisma.PlayUpdateInput = {};
    if (input.name != null) data.name = input.name;
    if (input.category != null) data.category = input.category;
    if (input.description != null) {
      data.description = sanitizeRichText(input.description);
    }
    if (input.diagram != null) data.diagram = parseDiagram(input.diagram);

    const updated = await this.prisma.play.updateMany({
      where: { id: input.id, teamId },
      data,
    });

    if (updated.count === 0) {
      throw new BadRequestException('Play not found');
    }

    const play = await this.prisma.play.findFirstOrThrow({
      where: { id: input.id, teamId },
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
      diagram: play.diagram ?? null,
      createdAt: play.createdAt,
      updatedAt: play.updatedAt,
    };
  }
}
