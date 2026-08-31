import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { resetDb, testPrisma } from './db';

// `skipIf` in RateLimitModule bails out under NODE_ENV=test, so the throttler is
// dormant for every other e2e. Run as production here to exercise both the
// guard and formatGraphqlError's 429 pass-through; the GraphQLModule factory
// also reads NODE_ENV at boot, so set it before compile.
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

const REFRESH = /* GraphQL */ `
  mutation ($token: String!) {
    refresh(refreshToken: $token) {
      accessToken
    }
  }
`;

const ME = /* GraphQL */ `
  query {
    me {
      id
    }
  }
`;

type GqlResponse = {
  data?: unknown;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
};

describe('rate limiting (e2e)', () => {
  let app: NestFastifyApplication;

  const post = (query: string, variables?: object) =>
    request(app.getHttpServer()).post('/graphql').send({ query, variables });

  beforeAll(async () => {
    process.env.NODE_ENV = 'production';

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
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    await app.get(PrismaService).$disconnect();
    await app.close();
    await testPrisma.$disconnect();
  });

  beforeEach(() => resetDb());

  it('blocks the 11th refresh attempt from one IP inside the window', async () => {
    const attempts = Array.from({ length: 10 }, () =>
      post(REFRESH, { token: 'not-a-real-token' }),
    );
    const allowed = await Promise.all(attempts);

    for (const res of allowed) {
      expect((res.body as GqlResponse).errors?.[0].extensions?.code).toBe(
        'UNAUTHENTICATED',
      );
    }

    const blocked = await post(REFRESH, { token: 'not-a-real-token' });
    const error = (blocked.body as GqlResponse).errors?.[0];

    expect(error?.extensions?.code).toBe('TOO_MANY_REQUESTS');
    expect(error?.message).toBe('Too many requests');
  });

  it('advertises the coarse global limit via X-RateLimit headers', async () => {
    const res = await post(ME);

    expect(res.headers['x-ratelimit-limit']).toBe('300');
    expect((res.body as GqlResponse).errors?.[0].extensions?.code).toBe(
      'UNAUTHENTICATED',
    );
  });
});
