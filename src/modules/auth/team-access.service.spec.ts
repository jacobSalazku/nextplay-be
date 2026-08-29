import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamAccessService } from './team-access.service';

type FindFirstArgs = { where?: Record<string, unknown> };

const teamFindFirst = jest.fn<
  Promise<{ id: string } | null>,
  [FindFirstArgs]
>();
const memberFindFirst = jest.fn<
  Promise<{ id: string; role: Role; teamId: string } | null>,
  [FindFirstArgs]
>();

const prisma = {
  team: { findFirst: teamFindFirst },
  member: { findFirst: memberFindFirst },
} as unknown as PrismaService;

describe('TeamAccessService', () => {
  let service: TeamAccessService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TeamAccessService(prisma);
  });

  describe('resolveTeamId', () => {
    it('returns the id when a team matches, trimming the ref', async () => {
      teamFindFirst.mockResolvedValue({ id: 't1' });

      await expect(service.resolveTeamId('  Falcons-ab12cd  ')).resolves.toBe(
        't1',
      );
    });

    it('throws NotFound for a blank ref without querying', async () => {
      await expect(service.resolveTeamId('   ')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(teamFindFirst).not.toHaveBeenCalled();
    });

    it('throws NotFound when nothing matches', async () => {
      teamFindFirst.mockResolvedValue(null);

      await expect(service.resolveTeamId('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('requireMembership', () => {
    it('returns the access context for an active member', async () => {
      memberFindFirst.mockResolvedValue({
        id: 'm1',
        role: Role.PLAYER,
        teamId: 't1',
      });

      await expect(service.requireMembership('t1', 'u1')).resolves.toEqual({
        teamId: 't1',
        memberId: 'm1',
        role: Role.PLAYER,
      });
    });

    it('filters the query by user, ACTIVE status and team', async () => {
      let capturedWhere: Record<string, unknown> | undefined;
      memberFindFirst.mockImplementation((args: FindFirstArgs) => {
        capturedWhere = args.where;
        return Promise.resolve({ id: 'm1', role: Role.COACH, teamId: 't1' });
      });

      await service.requireMembership('falcons', 'u1');

      expect(capturedWhere).toMatchObject({
        userId: 'u1',
        status: Status.ACTIVE,
      });
      expect(capturedWhere?.team).toBeDefined();
    });

    it('throws Forbidden when the user is not an active member', async () => {
      memberFindFirst.mockResolvedValue(null);

      await expect(
        service.requireMembership('t1', 'u1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Forbidden when a required role does not match', async () => {
      memberFindFirst.mockResolvedValue({
        id: 'm1',
        role: Role.PLAYER,
        teamId: 't1',
      });

      await expect(
        service.requireMembership('t1', 'u1', Role.COACH),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('passes when the required role matches', async () => {
      memberFindFirst.mockResolvedValue({
        id: 'm1',
        role: Role.COACH,
        teamId: 't1',
      });

      await expect(
        service.requireMembership('t1', 'u1', Role.COACH),
      ).resolves.toMatchObject({ role: Role.COACH });
    });

    it('throws Forbidden for a blank ref without querying', async () => {
      await expect(
        service.requireMembership('  ', 'u1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(memberFindFirst).not.toHaveBeenCalled();
    });
  });
});
