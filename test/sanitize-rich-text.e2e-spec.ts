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

const CREATE_PLAY = /* GraphQL */ `
  mutation ($input: CreatePlayInput!) {
    createPlay(input: $input) {
      id
      description
    }
  }
`;

type GqlResponse<T = Record<string, unknown>> = {
  data?: T | null;
  errors?: { message: string }[];
};

describe('rich-text sanitization (e2e)', () => {
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

  it('strips a script payload from a play description on write', async () => {
    const coach = (
      await post<{ devLogin: { accessToken: string; userId: string } }>(
        DEV_LOGIN,
        { email: 'coach@test.local' },
      )
    ).data!.devLogin;
    const team = await makeTeam({ creatorId: coach.userId });
    await testPrisma.member.create({
      data: {
        userId: coach.userId,
        teamId: team.id,
        role: Role.COACH,
        status: Status.ACTIVE,
      },
    });

    const body = await post<{
      createPlay: { id: string; description: string };
    }>(
      CREATE_PLAY,
      {
        input: {
          routeKey: team.routeKey,
          name: 'Trap',
          description:
            '<p>Press hard</p><script>fetch("/api/graphql")</script><img src=x onerror="steal()">',
          category: 'DEFENSIVE',
          canvas: 'x',
        },
      },
      coach.accessToken,
    );

    expect(body.errors).toBeUndefined();
    expect(body.data!.createPlay.description).toBe('<p>Press hard</p>');

    const stored = await testPrisma.play.findUniqueOrThrow({
      where: { id: body.data!.createPlay.id },
    });
    expect(stored.description).not.toMatch(/<script|onerror|<img/i);
  });
});
