import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import {
  ActivityType,
  AttendanceStatus,
  Location,
  Role,
  Status,
} from '@prisma/client';
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

const DELETE_MEMBER = /* GraphQL */ `
  mutation ($input: DeleteMemberInput!) {
    deleteMember(input: $input)
  }
`;

const SUBMIT_ATTENDANCE = /* GraphQL */ `
  mutation ($input: PlayerActivityAttendanceInput!) {
    submitAttendance(input: $input) {
      id
    }
  }
`;

const SUBMIT_STATLINES = /* GraphQL */ `
  mutation ($input: SubmitStatlinesInput!) {
    submitStatlines(input: $input) {
      success
    }
  }
`;

type GqlResponse<T = Record<string, unknown>> = {
  data?: T | null;
  errors?: { message: string }[];
};

const zeroStatline = {
  fieldGoalsMade: 0,
  fieldGoalsMissed: 0,
  threePointersMade: 0,
  threePointersMissed: 0,
  freeThrows: 0,
  freeThrowsMissed: 0,
  assists: 0,
  steals: 0,
  turnovers: 0,
  offensiveRebounds: 0,
  defensiveRebounds: 0,
  blocks: 0,
};

describe('removed member (e2e)', () => {
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
      devLogin: { accessToken: string; userId: string };
    }>(DEV_LOGIN, { email });
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

  const seed = async () => {
    const coach = await devLogin('coach@test.local');
    const team = await makeTeam({ creatorId: coach.userId });
    await testPrisma.member.create({
      data: {
        userId: coach.userId,
        teamId: team.id,
        role: Role.COACH,
        status: Status.ACTIVE,
      },
    });

    const playerSession = await devLogin('player@test.local');
    const player = await testPrisma.member.create({
      data: {
        userId: playerSession.userId,
        teamId: team.id,
        role: Role.PLAYER,
        status: Status.ACTIVE,
      },
    });

    const activity = await testPrisma.activity.create({
      data: {
        title: 'Game 1',
        time: '19:00',
        type: ActivityType.GAME,
        date: new Date('2026-01-10T19:00:00Z'),
        teamId: team.id,
        game: { create: { location: Location.HOME } },
      },
    });

    const attendance = await testPrisma.playerActivityAttendance.create({
      data: {
        activityId: activity.id,
        memberId: player.id,
        attendanceStatus: AttendanceStatus.ATTENDING,
      },
    });
    const statline = await testPrisma.statline.create({
      data: {
        gameId: activity.id,
        memberId: player.id,
        fieldGoalsMade: 5,
        fieldGoalsMissed: 3,
        threePointersMade: 1,
        threePointersMissed: 2,
        freeThrows: 4,
        freeThrowsMissed: 1,
        assists: 2,
        steals: 1,
        turnovers: 3,
        blocks: 0,
      },
    });

    return {
      coach,
      team,
      playerSession,
      player,
      activity,
      attendance,
      statline,
    };
  };

  it('soft-deletes the player and keeps their stats and attendance', async () => {
    const { coach, team, player, statline, attendance } = await seed();

    const body = await post(
      DELETE_MEMBER,
      { input: { id: player.id, routeKey: team.routeKey } },
      coach.accessToken,
    );
    expect(body.errors).toBeUndefined();

    const row = await testPrisma.member.findUniqueOrThrow({
      where: { id: player.id },
    });
    expect(row.status).toBe(Status.REMOVED);
    expect(
      await testPrisma.statline.findUnique({ where: { id: statline.id } }),
    ).not.toBeNull();
    expect(
      await testPrisma.playerActivityAttendance.findUnique({
        where: { id: attendance.id },
      }),
    ).not.toBeNull();
  });

  it('drops the removed player from the active roster', async () => {
    const { coach, team, player } = await seed();

    await post(
      DELETE_MEMBER,
      { input: { id: player.id, routeKey: team.routeKey } },
      coach.accessToken,
    );

    const activeRoster = await testPrisma.member.findMany({
      where: { teamId: team.id, status: Status.ACTIVE },
      select: { id: true },
    });
    expect(activeRoster.map((m) => m.id)).not.toContain(player.id);
  });

  it('refuses to record new attendance or stats for a removed player', async () => {
    const { coach, team, player, activity } = await seed();
    await post(
      DELETE_MEMBER,
      { input: { id: player.id, routeKey: team.routeKey } },
      coach.accessToken,
    );

    const attendance = await post(
      SUBMIT_ATTENDANCE,
      {
        input: {
          routeKey: team.routeKey,
          activityId: activity.id,
          memberId: player.id,
          reason: '',
          attendanceStatus: AttendanceStatus.ATTENDING,
        },
      },
      coach.accessToken,
    );
    expect(attendance.errors?.[0].message).toMatch(/not found/i);

    const statlines = await post(
      SUBMIT_STATLINES,
      {
        input: {
          routeKey: team.routeKey,
          players: [
            {
              memberId: player.id,
              activityId: activity.id,
              statlines: [zeroStatline],
            },
          ],
        },
      },
      coach.accessToken,
    );
    expect(statlines.errors?.[0].message).toMatch(/not found/i);
  });

  it('will not let the database hard-delete a member that has history', async () => {
    const { player } = await seed();

    await expect(
      testPrisma.member.delete({ where: { id: player.id } }),
    ).rejects.toThrow();
  });
});
