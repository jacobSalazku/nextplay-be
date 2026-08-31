import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { ActivityType, AttendanceStatus, Role, Status } from '@prisma/client';
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

// getAttendanceByActivities is a Query (was a Mutation) — a read must not be
// modelled as a mutation.
const GET_ATTENDANCE = /* GraphQL */ `
  query ($input: GetAttendanceByActivitiesInput!) {
    getAttendanceByActivities(input: $input) {
      id
      attendanceStatus
      memberId
    }
  }
`;

type GqlResponse<T = Record<string, unknown>> = {
  data?: T | null;
  errors?: { message: string }[];
};

describe('getAttendanceByActivities (e2e)', () => {
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

  const seedAttendance = async (userId: string) => {
    const team = await makeTeam({ creatorId: userId });
    const member = await testPrisma.member.create({
      data: {
        userId,
        teamId: team.id,
        role: Role.PLAYER,
        status: Status.ACTIVE,
      },
    });
    const activity = await testPrisma.activity.create({
      data: {
        title: 'Practice',
        time: '18:00',
        type: ActivityType.PRACTICE,
        date: new Date(),
        teamId: team.id,
      },
    });
    const attendance = await testPrisma.playerActivityAttendance.create({
      data: {
        activityId: activity.id,
        memberId: member.id,
        attendanceStatus: AttendanceStatus.ATTENDING,
      },
    });
    return { team, member, activity, attendance };
  };

  it('returns the attendance row for a team member', async () => {
    const session = await devLogin('member@test.local');
    const { team, member, activity, attendance } = await seedAttendance(
      session.userId,
    );

    const body = await post<{
      getAttendanceByActivities: {
        id: string;
        attendanceStatus: string;
        memberId: string;
      } | null;
    }>(
      GET_ATTENDANCE,
      {
        input: {
          routeKey: team.routeKey,
          activityId: activity.id,
          memberId: member.id,
        },
      },
      session.accessToken,
    );

    expect(body.errors).toBeUndefined();
    expect(body.data?.getAttendanceByActivities).toEqual({
      id: attendance.id,
      attendanceStatus: 'ATTENDING',
      memberId: member.id,
    });
  });

  it('refuses a caller who is not a member of the team (403)', async () => {
    const owner = await devLogin('owner@test.local');
    const { team, member, activity } = await seedAttendance(owner.userId);
    const outsider = await devLogin('outsider@test.local');

    const body = await post<{ getAttendanceByActivities: null }>(
      GET_ATTENDANCE,
      {
        input: {
          routeKey: team.routeKey,
          activityId: activity.id,
          memberId: member.id,
        },
      },
      outsider.accessToken,
    );

    expect(body.errors?.[0].message).toMatch(/not a member/i);
    expect(body.data?.getAttendanceByActivities).toBeNull();
  });
});
