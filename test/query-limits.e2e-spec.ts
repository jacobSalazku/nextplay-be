import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { testPrisma } from './db';

type GqlResponse = {
  data?: unknown;
  errors?: { message: string; extensions?: Record<string, unknown> }[];
};

describe('query limits (e2e)', () => {
  let app: NestFastifyApplication;

  const post = async (query: string) =>
    request(app.getHttpServer()).post('/graphql').send({ query });

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

  it('rejects an alias-amplified query as a client error, before any resolver', async () => {
    const aliases = Array.from(
      { length: 17 },
      (_, i) => `a${i}: me { id }`,
    ).join(' ');

    const res = await post(`query { ${aliases} }`);
    const body = res.body as GqlResponse;

    // reported (not thrown) -> HTTP 400 GRAPHQL_VALIDATION_FAILED, not a 500
    expect(res.status).toBe(400);
    expect(body.errors?.[0].message).toMatch(/too many aliases/i);
    expect(body.errors?.[0].extensions?.code).toBe('GRAPHQL_VALIDATION_FAILED');
  });

  it('lets an ordinary shallow query through the limits to the auth guard', async () => {
    const body = (await post(`query { me { id } }`)).body as GqlResponse;

    expect(body.errors?.[0].message).not.toMatch(/too many|too deep/i);
    expect(body.errors?.[0].message).toMatch(/unauthorized|no auth token/i);
  });
});
