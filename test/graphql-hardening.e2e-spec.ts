import { ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { GameplanService } from '../src/modules/gameplan/gameplan.service';
import { resetDb, testPrisma } from './db';
import { makeTeam, makeUser } from './factories';

// GraphQLModule reads NODE_ENV in a useFactory (at boot), so setting it here —
// before Test.compile() runs the factory — is enough.
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

const GET_GAMEPLAN = /* GraphQL */ `
  query ($input: GetGamePlansInput!) {
    getGameplan(input: $input) {
      id
    }
  }
`;

type GqlResponse = {
  data?: unknown;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
};

const LEAKY_MESSAGE =
  'Invalid `prisma.gamePlan.findMany()` — column "internal_secret" does not exist';

describe('GraphQL production hardening (e2e)', () => {
  let app: NestFastifyApplication;
  let jwt: JwtService;

  const post = async (query: string, variables?: object, token?: string) => {
    const req = request(app.getHttpServer()).post('/graphql');
    if (token) req.set('Authorization', `Bearer ${token}`);
    return (await req.send({ query, variables })).body as GqlResponse;
  };

  const tokenFor = (id: string) => jwt.sign({ sub: id, ver: 1 });

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GameplanService)
      .useValue({
        getGameplan: () => {
          throw new Error(LEAKY_MESSAGE);
        },
      })
      .compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    jwt = app.get(JwtService);
  });

  afterAll(async () => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    await app.get(PrismaService).$disconnect();
    await app.close();
    await testPrisma.$disconnect();
  });

  beforeEach(() => resetDb());

  it('rejects schema introspection', async () => {
    const body = await post('query { __schema { queryType { name } } }');

    expect(body.data).toBeFalsy();
    expect(body.errors?.[0].message).toMatch(/introspection/i);
  });

  it('masks an unhandled resolver error — no internal detail leaves the server', async () => {
    const user = await makeUser();
    const team = await makeTeam({ creatorId: user.id });
    await testPrisma.member.create({
      data: {
        userId: user.id,
        teamId: team.id,
        role: Role.PLAYER,
        status: Status.ACTIVE,
      },
    });

    const body = await post(
      GET_GAMEPLAN,
      { input: { routeKey: team.routeKey } },
      tokenFor(user.id),
    );

    expect(body.errors?.[0].message).toBe('Internal server error');
    expect(body.errors?.[0].message).not.toContain('prisma');
    expect(body.errors?.[0].extensions).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
    });
  });

  it('still surfaces a client error (FORBIDDEN) with its message, extensions trimmed to the code', async () => {
    const owner = await makeUser();
    const team = await makeTeam({ creatorId: owner.id });
    const outsider = await makeUser();

    const body = await post(
      GET_GAMEPLAN,
      { input: { routeKey: team.routeKey } },
      tokenFor(outsider.id),
    );

    expect(body.errors?.[0].message).toMatch(/not a member/i);
    expect(body.errors?.[0].extensions).toEqual({ code: 'FORBIDDEN' });
  });
});
