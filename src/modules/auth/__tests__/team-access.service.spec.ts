import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { resetDb, testPrisma } from '../../../../test/db';
import { makeMember, makeTeam, makeUser } from '../../../../test/factories';
import { TeamAccessService } from '../team-access.service';

// Runs against the real test database (docker-compose.test.yml): the point of
// this service is that its Prisma queries actually filter by membership and
// status, which a mock cannot verify.
describe('TeamAccessService', () => {
  const service = new TeamAccessService(testPrisma as unknown as PrismaService);

  beforeEach(() => resetDb());
  afterAll(() => testPrisma.$disconnect());

  describe('resolveTeamId', () => {
    it('resolves any public reference to the canonical id', async () => {
      const creator = await makeUser();
      const team = await makeTeam({ creatorId: creator.id });

      for (const ref of [
        team.id,
        team.shortId,
        team.routeKey!,
        team.slug,
        team.code,
      ]) {
        await expect(service.resolveTeamId(ref)).resolves.toBe(team.id);
      }
    });

    it('trims the reference before looking it up', async () => {
      const creator = await makeUser();
      const team = await makeTeam({ creatorId: creator.id });

      await expect(service.resolveTeamId(`  ${team.routeKey}  `)).resolves.toBe(
        team.id,
      );
    });

    it('throws NotFound when nothing matches', async () => {
      await expect(
        service.resolveTeamId('does-not-exist'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws NotFound for a blank reference', async () => {
      await expect(service.resolveTeamId('   ')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('requireMembership', () => {
    it('returns the access context for an ACTIVE member', async () => {
      const user = await makeUser();
      const team = await makeTeam({ creatorId: user.id });
      const member = await makeMember({
        userId: user.id,
        teamId: team.id,
        role: Role.COACH,
      });

      await expect(
        service.requireMembership(team.routeKey!, user.id),
      ).resolves.toEqual({
        teamId: team.id,
        memberId: member.id,
        role: Role.COACH,
      });
    });

    it('throws Forbidden for a user with no membership on the team', async () => {
      const owner = await makeUser();
      const team = await makeTeam({ creatorId: owner.id });
      const outsider = await makeUser();

      await expect(
        service.requireMembership(team.routeKey!, outsider.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it.each([Status.PENDING, Status.INACTIVE])(
      'throws Forbidden for a %s member',
      async (status) => {
        const user = await makeUser();
        const team = await makeTeam({ creatorId: user.id });
        await makeMember({ userId: user.id, teamId: team.id, status });

        await expect(
          service.requireMembership(team.routeKey!, user.id),
        ).rejects.toBeInstanceOf(ForbiddenException);
      },
    );

    it('does not leak "team exists" to a non-member (same error as unknown team)', async () => {
      const owner = await makeUser();
      const team = await makeTeam({ creatorId: owner.id });
      const outsider = await makeUser();

      const forReal = service
        .requireMembership(team.routeKey!, outsider.id)
        .catch((e: unknown) => (e as Error).message);
      const forFake = service
        .requireMembership('nope', outsider.id)
        .catch((e: unknown) => (e as Error).message);

      expect(await forReal).toBe(await forFake);
    });

    it('passes when the required role matches', async () => {
      const user = await makeUser();
      const team = await makeTeam({ creatorId: user.id });
      await makeMember({
        userId: user.id,
        teamId: team.id,
        role: Role.COACH,
      });

      await expect(
        service.requireMembership(team.routeKey!, user.id, Role.COACH),
      ).resolves.toMatchObject({ role: Role.COACH });
    });

    it('throws Forbidden when the required role does not match', async () => {
      const user = await makeUser();
      const team = await makeTeam({ creatorId: user.id });
      await makeMember({
        userId: user.id,
        teamId: team.id,
        role: Role.PLAYER,
      });

      await expect(
        service.requireMembership(team.routeKey!, user.id, Role.COACH),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('scopes membership to the referenced team', async () => {
      const user = await makeUser();
      const teamA = await makeTeam({ creatorId: user.id });
      const teamB = await makeTeam({ creatorId: user.id });
      await makeMember({ userId: user.id, teamId: teamA.id });

      await expect(
        service.requireMembership(teamA.routeKey!, user.id),
      ).resolves.toMatchObject({ teamId: teamA.id });
      await expect(
        service.requireMembership(teamB.routeKey!, user.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Forbidden for a blank reference without querying', async () => {
      await expect(
        service.requireMembership('  ', 'anyone'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
