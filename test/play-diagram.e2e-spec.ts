import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { resetDb, testPrisma } from './db';
import { makeMember, makeTeam } from './factories';

const DEV_LOGIN = /* GraphQL */ `
  mutation ($email: String!) {
    devLogin(email: $email) {
      accessToken
      userId
    }
  }
`;

const CREATE_PLAY = /* GraphQL */ `
  mutation ($input: CreatePlayInput!) {
    createPlay(input: $input) {
      id
      diagram
      canvas
    }
  }
`;

const UPDATE_PLAY = /* GraphQL */ `
  mutation ($input: UpdatePlayInput!) {
    updatePlay(input: $input) {
      id
      name
      diagram
    }
  }
`;

const EDITOR_CONFIG = /* GraphQL */ `
  query {
    playEditorConfig {
      actionTypes
      courts
      formations {
        id
        name
        court
        objects
      }
    }
  }
`;

type GqlResponse<T = Record<string, unknown>> = {
  data?: T | null;
  errors?: { message: string }[];
};

const diagram = {
  version: 1,
  court: 'half',
  phases: [
    {
      id: 'p1',
      note: '  1 brings it up  ',
      objects: [
        { id: 'o1', kind: 'offense', label: '1', x: 50, y: 80 },
        { id: 'o5', kind: 'offense', label: '5', x: 70, y: 20 },
      ],
      actions: [{ id: 'a1', type: 'pass', fromId: 'o1', toId: 'o5' }],
    },
  ],
  timeline: [{ id: 's1', actionIds: ['a1'], durationMs: 800 }],
};

describe('play diagram (e2e)', () => {
  let app: NestFastifyApplication;

  const post = async <T = Record<string, unknown>>(
    query: string,
    variables?: object,
    token?: string,
  ): Promise<GqlResponse<T>> => {
    const req = request(app.getHttpServer()).post('/graphql');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return (await req.send({ query, variables })).body as GqlResponse<T>;
  };

  const login = async (email: string) =>
    (
      await post<{ devLogin: { accessToken: string; userId: string } }>(
        DEV_LOGIN,
        { email },
      )
    ).data!.devLogin;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.get(PrismaService).$disconnect();
    await app.close();
    await testPrisma.$disconnect();
  });

  beforeEach(() => resetDb());

  it('round-trips a diagram through createPlay and normalises the phase note', async () => {
    // Arrange
    const coach = await login('coach@test.local');
    const team = await makeTeam({ creatorId: coach.userId });
    await makeMember({
      userId: coach.userId,
      teamId: team.id,
      role: Role.COACH,
    });

    // Act
    const body = await post<{
      createPlay: {
        id: string;
        diagram: typeof diagram;
        canvas: string | null;
      };
    }>(
      CREATE_PLAY,
      {
        input: {
          routeKey: team.routeKey,
          name: 'Horns flare',
          description: '',
          category: 'OFFENSIVE',
          diagram,
        },
      },
      coach.accessToken,
    );

    // Assert
    expect(body.errors).toBeUndefined();
    expect(body.data!.createPlay.canvas).toBeNull();
    expect(body.data!.createPlay.diagram.phases[0].note).toBe('1 brings it up');
  });

  it('saves a new diagram through updatePlay', async () => {
    // Arrange
    const coach = await login('coach@test.local');
    const team = await makeTeam({ creatorId: coach.userId });
    await makeMember({
      userId: coach.userId,
      teamId: team.id,
      role: Role.COACH,
    });
    const created = await post<{ createPlay: { id: string } }>(
      CREATE_PLAY,
      {
        input: {
          routeKey: team.routeKey,
          name: 'Draft',
          description: '',
          category: 'OFFENSIVE',
          diagram,
        },
      },
      coach.accessToken,
    );

    // Act
    const twoPhase = {
      ...diagram,
      phases: [diagram.phases[0], { ...diagram.phases[0], id: 'p2' }],
    };
    const body = await post<{
      updatePlay: { name: string; diagram: typeof diagram };
    }>(
      UPDATE_PLAY,
      {
        input: {
          id: created.data!.createPlay.id,
          routeKey: team.routeKey,
          name: 'Horns flare v2',
          diagram: twoPhase,
        },
      },
      coach.accessToken,
    );

    // Assert
    expect(body.errors).toBeUndefined();
    expect(body.data!.updatePlay.name).toBe('Horns flare v2');
    expect(body.data!.updatePlay.diagram.phases).toHaveLength(2);
  });

  it('rejects a diagram with more than 15 phases', async () => {
    // Arrange
    const coach = await login('coach@test.local');
    const team = await makeTeam({ creatorId: coach.userId });
    await makeMember({
      userId: coach.userId,
      teamId: team.id,
      role: Role.COACH,
    });

    // Act
    const tooMany = {
      ...diagram,
      phases: Array.from({ length: 16 }, (_, i) => ({
        ...diagram.phases[0],
        id: `p${i}`,
      })),
    };
    const body = await post(
      CREATE_PLAY,
      {
        input: {
          routeKey: team.routeKey,
          name: 'Too long',
          description: '',
          category: 'OFFENSIVE',
          diagram: tooMany,
        },
      },
      coach.accessToken,
    );

    // Assert
    expect(body.errors?.[0]?.message).toMatch(/15|too large|invalid/i);
  });

  it('rejects a non-member trying to update a play', async () => {
    // Arrange
    const coach = await login('coach@test.local');
    const team = await makeTeam({ creatorId: coach.userId });
    await makeMember({
      userId: coach.userId,
      teamId: team.id,
      role: Role.COACH,
    });
    const created = await post<{ createPlay: { id: string } }>(
      CREATE_PLAY,
      {
        input: {
          routeKey: team.routeKey,
          name: 'Private',
          description: '',
          category: 'OFFENSIVE',
          diagram,
        },
      },
      coach.accessToken,
    );
    const outsider = await login('outsider@test.local');

    // Act
    const body = await post(
      UPDATE_PLAY,
      {
        input: {
          id: created.data!.createPlay.id,
          routeKey: team.routeKey,
          name: 'Hijacked',
        },
      },
      outsider.accessToken,
    );

    // Assert
    expect(body.errors?.[0]?.message).toMatch(/forbidden|not a member|access/i);
  });

  it('returns the editor config with formation presets', async () => {
    // Arrange
    const coach = await login('coach@test.local');

    // Act
    const body = await post<{
      playEditorConfig: {
        actionTypes: string[];
        courts: string[];
        formations: { id: string; court: string }[];
      };
    }>(EDITOR_CONFIG, {}, coach.accessToken);

    // Assert
    expect(body.errors).toBeUndefined();
    expect(body.data!.playEditorConfig.actionTypes).toContain('dribble');
    expect(
      body.data!.playEditorConfig.formations.some((f) => f.id === '5-out'),
    ).toBe(true);
  });
});
