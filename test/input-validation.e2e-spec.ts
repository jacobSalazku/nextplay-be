import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { resetDb, testPrisma } from './db';
import { makeTeam } from './factories';

const DEV_LOGIN = /* GraphQL */ `
  mutation ($email: String!) {
    devLogin(email: $email) {
      accessToken
      userId
    }
  }
`;

const CREATE_GAMEPLAN = /* GraphQL */ `
  mutation ($input: CreateGamePlanInput!) {
    createGamePlan(input: $input) {
      id
    }
  }
`;

const CREATE_GAME = /* GraphQL */ `
  mutation ($input: CreateGameInput!) {
    createGame(input: $input) {
      id
      duration
    }
  }
`;

type GqlError = {
  message: string;
  extensions?: {
    code?: string;
    originalError?: { message?: string[] };
  };
};

type GqlResponse<T = Record<string, unknown>> = {
  data?: T | null;
  errors?: GqlError[];
};

/** ValidationPipe puts the per-field messages under originalError, not `message`. */
const constraints = (err?: GqlError): string =>
  (err?.extensions?.originalError?.message ?? []).join(' ');

describe('input validation (e2e)', () => {
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

  const coachOnTeam = async () => {
    const body = await post<{
      devLogin: { accessToken: string; userId: string };
    }>(DEV_LOGIN, { email: 'coach@test.local' });
    const session = body.data!.devLogin;
    const team = await makeTeam({ creatorId: session.userId });
    await testPrisma.member.create({
      data: {
        userId: session.userId,
        teamId: team.id,
        role: Role.COACH,
        status: Status.ACTIVE,
      },
    });
    return { session, team };
  };

  const validGame = (teamId: string) => ({
    title: 'Season opener',
    time: '19:30',
    duration: 90,
    date: new Date('2026-09-01T19:30:00.000Z').toISOString(),
    teamId,
    location: 'HOME',
    type: 'GAME',
  });

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

  it('rejects a gameplan with an empty name', async () => {
    const { session, team } = await coachOnTeam();

    const body = await post(
      CREATE_GAMEPLAN,
      {
        input: {
          routeKey: team.routeKey,
          name: '',
          activityId: 'anything',
          playsId: [],
        },
      },
      session.accessToken,
    );

    expect(body.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    expect(constraints(body.errors?.[0])).toMatch(/name/i);
  });

  it('rejects a game with a negative duration', async () => {
    const { session, team } = await coachOnTeam();

    const body = await post(
      CREATE_GAME,
      { input: { ...validGame(team.id), duration: -30 } },
      session.accessToken,
    );

    expect(body.errors?.[0].extensions?.code).toBe('BAD_REQUEST');
    expect(constraints(body.errors?.[0])).toMatch(
      /duration must be a positive number/i,
    );
  });

  it('accepts a well-formed game', async () => {
    const { session, team } = await coachOnTeam();

    const body = await post<{ createGame: { id: string; duration: number } }>(
      CREATE_GAME,
      { input: validGame(team.id) },
      session.accessToken,
    );

    expect(body.errors).toBeUndefined();
    expect(body.data?.createGame.duration).toBe(90);
  });
});
