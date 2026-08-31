import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { ActivityBuilder } from '../activity.builder';
import { ActivityService } from '../activity.service';
import type { UpdateGameInput } from '../dto/update';

type FindFirstArgs = { where?: Record<string, unknown> };
type ActivityRow = { id?: string; date?: Date; type?: ActivityType } | null;

const activityFindFirst = jest.fn<Promise<ActivityRow>, [FindFirstArgs]>();
const activityDelete = jest.fn<Promise<{ id: string }>, [unknown]>();
const activityFindUniqueOrThrow = jest.fn<Promise<unknown>, [unknown]>();
const builderCreate = jest.fn<Promise<{ id: string }>, [unknown, string]>();
const builderUpdate = jest.fn<Promise<{ id: string }>, [string, unknown]>();

const prisma = {
  activity: {
    findFirst: activityFindFirst,
    delete: activityDelete,
    findUniqueOrThrow: activityFindUniqueOrThrow,
  },
} as unknown as PrismaService;
const builder = {
  create: builderCreate,
  update: builderUpdate,
} as unknown as ActivityBuilder;

const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
};
const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};

const gameUpdate = (id: string): UpdateGameInput =>
  ({ id, type: ActivityType.GAME, teamId: 'ignored' }) as UpdateGameInput;

describe('ActivityService (team authorization)', () => {
  let service: ActivityService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ActivityService(prisma, builder);
    // create/update re-read the activity through activitySelect before returning
    activityFindUniqueOrThrow.mockResolvedValue({
      id: 'a1',
      title: 't',
      date: new Date(),
      time: '10:00',
      duration: null,
      type: ActivityType.GAME,
      teamId: 't1',
      attendees: [],
      game: null,
      practice: null,
    });
  });

  describe('deleteActivity', () => {
    it('deletes when the activity belongs to the team', async () => {
      activityFindFirst.mockResolvedValue({ id: 'a1' });
      activityDelete.mockResolvedValue({ id: 'a1' });

      await service.deleteActivity('a1', 't1');

      expect(activityFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'a1', teamId: 't1' } }),
      );
      expect(activityDelete).toHaveBeenCalled();
    });

    it('throws NotFound and does not delete when the activity is on another team', async () => {
      activityFindFirst.mockResolvedValue(null);

      await expect(service.deleteActivity('a1', 't1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(activityDelete).not.toHaveBeenCalled();
    });
  });

  describe('updateActivity', () => {
    it('throws NotFound and does not update when the activity is on another team', async () => {
      activityFindFirst.mockResolvedValue(null);

      await expect(
        service.updateActivity(gameUpdate('a1'), 't1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(builderUpdate).not.toHaveBeenCalled();
    });

    it('rejects editing a past game', async () => {
      activityFindFirst.mockResolvedValue({
        date: yesterday(),
        type: ActivityType.GAME,
      });

      await expect(
        service.updateActivity(gameUpdate('a1'), 't1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(builderUpdate).not.toHaveBeenCalled();
    });

    it('allows editing a future game', async () => {
      activityFindFirst.mockResolvedValue({
        date: tomorrow(),
        type: ActivityType.GAME,
      });
      builderUpdate.mockResolvedValue({ id: 'a1' });

      await service.updateActivity(gameUpdate('a1'), 't1');

      expect(builderUpdate).toHaveBeenCalledWith('a1', expect.anything());
    });

    it('allows editing a past non-game/practice activity (e.g. meeting)', async () => {
      activityFindFirst.mockResolvedValue({
        date: yesterday(),
        type: ActivityType.MEETING,
      });
      builderUpdate.mockResolvedValue({ id: 'a1' });

      await service.updateActivity(
        { id: 'a1', type: ActivityType.MEETING } as UpdateGameInput,
        't1',
      );

      expect(builderUpdate).toHaveBeenCalled();
    });
  });

  describe('createActivity', () => {
    it('passes the guard-resolved teamId to the builder', async () => {
      builderCreate.mockResolvedValue({ id: 'a1' });

      await service.createActivity({ type: ActivityType.GAME } as never, 't1');

      expect(builderCreate).toHaveBeenCalledWith(expect.anything(), 't1');
    });
  });
});
