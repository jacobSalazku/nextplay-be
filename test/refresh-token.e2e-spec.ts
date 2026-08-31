import { createHash } from 'node:crypto';
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

const ME = /* GraphQL */ `
  query {
    me {
      id
    }
  }
`;

type GqlResponse<T = Record<string, unknown>> = {
  data?: T | null;
  errors?: { message: string }[];
};

const sha256 = (raw: string) => createHash('sha256').update(raw).digest('hex');

describe('refresh-token rotation (e2e)', () => {
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

  const devLogin = async (email: string) => {
    const body = await post<{
      devLogin: { accessToken: string; refreshToken: string; userId: string };
    }>(DEV_LOGIN, { email });
    expect(body.errors).toBeUndefined();
    return body.data!.devLogin;
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

  it('rotates the refresh token and keeps the session alive', async () => {
    const first = await devLogin('rotate@test.local');

    const refreshed = await post<{
      refresh: { accessToken: string; refreshToken: string };
    }>(REFRESH, { token: first.refreshToken });

    expect(refreshed.data!.refresh.refreshToken).not.toBe(first.refreshToken);
    expect(
      (await post(ME, undefined, refreshed.data!.refresh.accessToken)).errors,
    ).toBeUndefined();
  });

  it('reusing a rotated token past grace kills every session for that user', async () => {
    const first = await devLogin('victim@test.local');
    const rotated = await post<{
      refresh: { accessToken: string; refreshToken: string };
    }>(REFRESH, { token: first.refreshToken });
    const goodAccessToken = rotated.data!.refresh.accessToken;

    // the new access token works right up until the replay
    expect((await post(ME, undefined, goodAccessToken)).errors).toBeUndefined();

    // force the old token unambiguously past the grace window
    await testPrisma.refreshToken.update({
      where: { tokenHash: sha256(first.refreshToken) },
      data: { rotatedAt: new Date(Date.now() - 60_000) },
    });

    const replay = await post(REFRESH, { token: first.refreshToken });
    expect(replay.data).toBeFalsy();
    expect(replay.errors?.[0].message).toMatch(/unauthorized/i);

    // the family is burned: the previously-good access token is now dead,
    // and the rotated refresh token no longer works either
    expect((await post(ME, undefined, goodAccessToken)).data).toBeFalsy();
    expect(
      (await post(REFRESH, { token: rotated.data!.refresh.refreshToken })).data,
    ).toBeFalsy();
  });

  it('rejects an expired refresh token', async () => {
    const session = await devLogin('expired@test.local');
    await testPrisma.refreshToken.update({
      where: { tokenHash: sha256(session.refreshToken) },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const body = await post(REFRESH, { token: session.refreshToken });

    expect(body.data).toBeFalsy();
    expect(body.errors?.[0].message).toMatch(/unauthorized/i);
  });

  it('keeps two device sessions independent', async () => {
    const laptop = await devLogin('multi@test.local');
    const phone = await devLogin('multi@test.local');

    // refreshing the laptop leaves the phone untouched
    const laptopAgain = await post<{ refresh: { refreshToken: string } }>(
      REFRESH,
      { token: laptop.refreshToken },
    );
    expect(laptopAgain.errors).toBeUndefined();

    const phoneAgain = await post<{ refresh: { accessToken: string } }>(
      REFRESH,
      { token: phone.refreshToken },
    );
    expect(phoneAgain.errors).toBeUndefined();
    expect(phoneAgain.data!.refresh.accessToken).toEqual(expect.any(String));
  });

  it('logout invalidates the refresh token', async () => {
    const session = await devLogin('bye@test.local');

    await post(
      /* GraphQL */ `
        mutation {
          logout
        }
      `,
      undefined,
      session.accessToken,
    );

    const body = await post(REFRESH, { token: session.refreshToken });
    expect(body.data).toBeFalsy();
    expect(body.errors?.[0].message).toMatch(/unauthorized/i);
  });
});
