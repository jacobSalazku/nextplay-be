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
      refreshToken
      userId
    }
  }
`;

const REFRESH = /* GraphQL */ `
  mutation ($token: String!) {
    refresh(refreshToken: $token) {
      accessToken
      refreshToken
    }
  }
`;

const LOGOUT = /* GraphQL */ `
  mutation {
    logout
  }
`;

const ME = /* GraphQL */ `
  query {
    me {
      id
    }
  }
`;

const GET_GAMEPLAN = /* GraphQL */ `
  query ($input: GetGamePlansInput!) {
    getGameplan(input: $input) {
      id
    }
  }
`;

type GqlResponse<T = Record<string, unknown>> = {
  data?: T | null;
  errors?: { message: string }[];
};

describe('auth + team authorization (e2e)', () => {
  let app: NestFastifyApplication;

  async function post<T = Record<string, unknown>>(
    query: string,
    variables?: object,
    token?: string,
  ): Promise<GqlResponse<T>> {
    const req = request(app.getHttpServer()).post('/graphql');
    if (token) req.set('Authorization', `Bearer ${token}`);
    const res = await req.send({ query, variables });
    return res.body as GqlResponse<T>;
  }

  async function devLogin(email: string) {
    const body = await post<{
      devLogin: { accessToken: string; refreshToken: string; userId: string };
    }>(DEV_LOGIN, { email });
    expect(body.errors).toBeUndefined();
    return body.data!.devLogin;
  }

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

  it('devLogin issues a working session', async () => {
    const session = await devLogin('coach@test.local');
    expect(session.accessToken).toEqual(expect.any(String));
    expect(session.userId).toEqual(expect.any(String));
  });

  it('an ACTIVE member can call a TeamMemberGuard-protected query', async () => {
    const session = await devLogin('member@test.local');
    const team = await makeTeam({ creatorId: session.userId });
    await testPrisma.member.create({
      data: {
        userId: session.userId,
        teamId: team.id,
        role: Role.PLAYER,
        status: Status.ACTIVE,
      },
    });

    const body = await post<{ getGameplan: unknown[] }>(
      GET_GAMEPLAN,
      { input: { routeKey: team.routeKey } },
      session.accessToken,
    );

    expect(body.errors).toBeUndefined();
    expect(body.data?.getGameplan).toEqual([]);
  });

  it('a non-member is refused (403) by the same query', async () => {
    const owner = await devLogin('owner@test.local');
    const team = await makeTeam({ creatorId: owner.userId });
    const outsider = await devLogin('outsider@test.local');

    const body = await post(
      GET_GAMEPLAN,
      { input: { routeKey: team.routeKey } },
      outsider.accessToken,
    );

    expect(body.data).toBeFalsy();
    expect(body.errors?.[0].message).toMatch(/not a member/i);
  });

  it('rejects the query with no bearer token', async () => {
    const body = await post(GET_GAMEPLAN, { input: { routeKey: 'anything' } });

    expect(body.data).toBeFalsy();
    expect(body.errors?.[0].message).toMatch(/no auth token|unauthorized/i);
  });

  it('devLogin is disabled unless DEV_AUTH_ENABLED is "true"', async () => {
    const original = process.env.DEV_AUTH_ENABLED;
    delete process.env.DEV_AUTH_ENABLED;
    try {
      const body = await post(DEV_LOGIN, { email: 'nope@test.local' });
      expect(body.data).toBeFalsy();
      expect(body.errors?.[0].message).toMatch(/disabled/i);
    } finally {
      process.env.DEV_AUTH_ENABLED = original;
    }
  });

  describe('refresh + logout', () => {
    const meWith = (token?: string) => post(ME, undefined, token);

    it('exchanges a valid refresh token for a fresh session', async () => {
      const first = await devLogin('rotate@test.local');

      const body = await post<{
        refresh: { accessToken: string; refreshToken: string };
      }>(REFRESH, { token: first.refreshToken });

      expect(body.errors).toBeUndefined();
      expect(body.data!.refresh.accessToken).toEqual(expect.any(String));
      expect(body.data!.refresh.refreshToken).not.toBe(first.refreshToken);

      // the new access token works
      expect(
        (await meWith(body.data!.refresh.accessToken)).errors,
      ).toBeUndefined();
    });

    it('rejects an unknown refresh token', async () => {
      const body = await post(REFRESH, { token: 'not-a-real-token' });

      expect(body.data).toBeFalsy();
      expect(body.errors?.[0].message).toMatch(/unauthorized/i);
    });

    it('tolerates re-using a token within the rotation grace window', async () => {
      const session = await devLogin('grace@test.local');
      await post(REFRESH, { token: session.refreshToken }); // rotates it

      // a near-simultaneous second refresh (another tab) still succeeds
      const body = await post<{ refresh: { accessToken: string } }>(REFRESH, {
        token: session.refreshToken,
      });

      expect(body.errors).toBeUndefined();
      expect(body.data!.refresh.accessToken).toEqual(expect.any(String));
    });

    it('logout bumps tokenVersion — the old access token stops working', async () => {
      const session = await devLogin('bye@test.local');
      expect((await meWith(session.accessToken)).errors).toBeUndefined();

      const out = await post<{ logout: boolean }>(
        LOGOUT,
        undefined,
        session.accessToken,
      );
      expect(out.data?.logout).toBe(true);

      const after = await meWith(session.accessToken);
      expect(after.data).toBeFalsy();
      expect(after.errors?.[0].message).toMatch(/token version|unauthorized/i);
    });
  });
});
