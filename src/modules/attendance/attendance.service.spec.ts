import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Role } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { TeamAccess } from '../auth/team-access.service';
import { AttendanceService } from './attendance.service';
import type { PlayerActivityAttendanceInput } from './dto';

type Args = { where?: Record<string, unknown> };

const attFindFirst = jest.fn<Promise<unknown>, [Args]>();
const attUpsert = jest.fn<Promise<{ id: string }>, [unknown]>();
const activityFindFirst = jest.fn<Promise<{ id: string } | null>, [Args]>();
const memberFindFirst = jest.fn<Promise<{ id: string } | null>, [Args]>();

const prisma = {
  playerActivityAttendance: { findFirst: attFindFirst, upsert: attUpsert },
  activity: { findFirst: activityFindFirst },
  member: { findFirst: memberFindFirst },
} as unknown as PrismaService;

const access = (over: Partial<TeamAccess> = {}): TeamAccess => ({
  teamId: 't1',
  memberId: 'm-caller',
  role: Role.PLAYER,
  ...over,
});

const input = (over: Partial<PlayerActivityAttendanceInput> = {}) =>
  ({
    routeKey: 'falcons',
    activityId: 'a1',
    memberId: 'm-caller',
    reason: '',
    attendanceStatus: AttendanceStatus.ATTENDING,
    ...over,
  }) as PlayerActivityAttendanceInput;

describe('AttendanceService', () => {
  let service: AttendanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AttendanceService(prisma);
    activityFindFirst.mockResolvedValue({ id: 'a1' });
    memberFindFirst.mockResolvedValue({ id: 'm-caller' });
    attUpsert.mockResolvedValue({ id: 'att1' });
  });

  describe('submit', () => {
    it('lets a player set their own attendance', async () => {
      await service.submit(input(), access());
      expect(attUpsert).toHaveBeenCalled();
    });

    it("blocks a player setting another member's attendance", async () => {
      await expect(
        service.submit(input({ memberId: 'm-other' }), access()),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(attUpsert).not.toHaveBeenCalled();
    });

    it("lets a coach set another member's attendance", async () => {
      memberFindFirst.mockResolvedValue({ id: 'm-other' });
      await service.submit(
        input({ memberId: 'm-other' }),
        access({ role: Role.COACH }),
      );
      expect(attUpsert).toHaveBeenCalled();
    });

    it('404s when the activity is not on the team', async () => {
      activityFindFirst.mockResolvedValue(null);
      await expect(service.submit(input(), access())).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(attUpsert).not.toHaveBeenCalled();
    });

    it('404s when the target member is not on the team', async () => {
      memberFindFirst.mockResolvedValue(null);
      await expect(
        service.submit(input(), access({ role: Role.COACH })),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(attUpsert).not.toHaveBeenCalled();
    });
  });

  describe('getAttendance', () => {
    it('scopes the lookup to the team on both the activity and the member', async () => {
      let where: Record<string, unknown> | undefined;
      attFindFirst.mockImplementation((args: Args) => {
        where = args.where;
        return Promise.resolve(null);
      });

      await service.getAttendance(
        { routeKey: 'falcons', activityId: 'a1', memberId: 'm1' },
        't1',
      );

      expect(where).toMatchObject({
        activityId: 'a1',
        memberId: 'm1',
        activity: { teamId: 't1' },
        member: { teamId: 't1' },
      });
    });
  });
});
