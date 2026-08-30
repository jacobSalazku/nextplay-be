import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { resetDb, testPrisma } from '../../../../test/db';
import { makeMember, makeTeam, makeUser } from '../../../../test/factories';
import { CurrentTeam } from '../decorator/current-team.decorator';
import { TeamAccessService } from '../team-access.service';
import { TeamCoachGuard, TeamMemberGuard } from './team-access.guard';

type Req = { user?: { userId: string }; team?: unknown };

/** Minimal GraphQL ExecutionContext: only what GqlExecutionContext.create reads. */
function gqlContext(req: Req, args: unknown): ExecutionContext {
  return {
    getType: () => 'graphql',
    getArgs: () => [undefined, args, { req }, undefined],
    getClass: () => class {},
    getHandler: () => () => undefined,
  } as unknown as ExecutionContext;
}

/** Pull the factory out of a param decorator so it can be called directly. */
function paramFactory(decorator: () => ParameterDecorator) {
  class Probe {
    handler(@decorator() _value: unknown) {
      return _value;
    }
  }
  const meta = Reflect.getMetadata(
    ROUTE_ARGS_METADATA,
    Probe,
    'handler',
  ) as Record<
    string,
    { factory: (data: unknown, ctx: ExecutionContext) => unknown }
  >;
  return meta[Object.keys(meta)[0]].factory;
}

describe('team access guards', () => {
  const access = new TeamAccessService(testPrisma as unknown as PrismaService);
  const memberGuard = new TeamMemberGuard(access);
  const coachGuard = new TeamCoachGuard(access);

  beforeEach(() => resetDb());
  afterAll(() => testPrisma.$disconnect());

  describe('TeamMemberGuard', () => {
    it('allows an ACTIVE member and stashes the access context on req.team', async () => {
      const user = await makeUser();
      const team = await makeTeam({ creatorId: user.id });
      const member = await makeMember({
        userId: user.id,
        teamId: team.id,
        role: Role.PLAYER,
      });

      const req: Req = { user: { userId: user.id } };
      await expect(
        memberGuard.canActivate(gqlContext(req, { routeKey: team.routeKey })),
      ).resolves.toBe(true);

      expect(req.team).toEqual({
        teamId: team.id,
        memberId: member.id,
        role: Role.PLAYER,
      });
    });

    it.each([
      ['top-level routeKey', (rk: string) => ({ routeKey: rk })],
      ['nested input.routeKey', (rk: string) => ({ input: { routeKey: rk } })],
      ['nested input.teamId', (rk: string) => ({ input: { teamId: rk } })],
    ])('reads the team ref from %s', async (_label, buildArgs) => {
      const { user, team } = await activeMember();

      await expect(
        memberGuard.canActivate(
          gqlContext({ user: { userId: user.id } }, buildArgs(team.routeKey!)),
        ),
      ).resolves.toBe(true);
    });

    it('throws Forbidden for a non-member', async () => {
      const owner = await makeUser();
      const team = await makeTeam({ creatorId: owner.id });
      const outsider = await makeUser();

      await expect(
        memberGuard.canActivate(
          gqlContext(
            { user: { userId: outsider.id } },
            { routeKey: team.routeKey },
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Forbidden when the request has no authenticated user', async () => {
      await expect(
        memberGuard.canActivate(gqlContext({}, { routeKey: 'anything' })),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequest when no team reference is present in the args', async () => {
      const user = await makeUser();

      await expect(
        memberGuard.canActivate(gqlContext({ user: { userId: user.id } }, {})),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('TeamCoachGuard', () => {
    it('allows a COACH', async () => {
      const { user, team } = await activeMember(Role.COACH);

      await expect(
        coachGuard.canActivate(
          gqlContext(
            { user: { userId: user.id } },
            { routeKey: team.routeKey },
          ),
        ),
      ).resolves.toBe(true);
    });

    it('throws Forbidden for a non-coach member', async () => {
      const { user, team } = await activeMember(Role.PLAYER);

      await expect(
        coachGuard.canActivate(
          gqlContext(
            { user: { userId: user.id } },
            { routeKey: team.routeKey },
          ),
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('@CurrentTeam()', () => {
    const factory = paramFactory(CurrentTeam as () => ParameterDecorator);

    it('returns the team context the guard stashed', () => {
      const team = { teamId: 't1', memberId: 'm1', role: Role.COACH };
      expect(factory(undefined, gqlContext({ team }, {}))).toEqual(team);
    });

    it('is undefined when no guard ran', () => {
      expect(factory(undefined, gqlContext({}, {}))).toBeUndefined();
    });
  });
});

async function activeMember(role: Role = Role.PLAYER) {
  const user = await makeUser();
  const team = await makeTeam({ creatorId: user.id });
  await makeMember({ userId: user.id, teamId: team.id, role });
  return { user, team };
}
