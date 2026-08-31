import { Category } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlayService } from '../play.service';

type Args = { where?: Record<string, unknown> };

const playFindFirst = jest.fn<Promise<unknown>, [Args]>();
const playFindMany = jest.fn<Promise<unknown[]>, [Args]>();
const playDeleteMany = jest.fn<Promise<{ count: number }>, [Args]>();

const prisma = {
  play: {
    findFirst: playFindFirst,
    findMany: playFindMany,
    deleteMany: playDeleteMany,
  },
} as unknown as PrismaService;

const row = {
  id: 'p1',
  name: 'Horns',
  category: Category.OFFENSIVE,
  description: '',
  canvas: '{}',
  createdAt: new Date(),
  updatedAt: new Date(),
  team: { routeKey: 'falcons-ab12cd', shortId: 'ab12cd' },
};

describe('PlayService', () => {
  let service: PlayService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlayService(prisma);
  });

  it('getPlays scopes to the team', async () => {
    playFindMany.mockResolvedValue([]);
    await service.getPlays('t1');
    expect(playFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId: 't1' } }),
    );
  });

  it('getPlayById returns null for a play on another team', async () => {
    playFindFirst.mockResolvedValue(null);
    await expect(service.getPlayById('p1', 't1')).resolves.toBeNull();
    expect(playFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'p1', teamId: 't1' } }),
    );
  });

  it('getPlayById maps a play that belongs to the team', async () => {
    playFindFirst.mockResolvedValue(row);
    await expect(service.getPlayById('p1', 't1')).resolves.toMatchObject({
      id: 'p1',
      routeKey: 'falcons-ab12cd',
    });
  });

  it('deletePlay only deletes within the team and reports whether a row went', async () => {
    playDeleteMany.mockResolvedValue({ count: 0 });
    await expect(service.deletePlay('p1', 't1')).resolves.toBe(false);
    expect(playDeleteMany).toHaveBeenCalledWith({
      where: { id: 'p1', teamId: 't1' },
    });

    playDeleteMany.mockResolvedValue({ count: 1 });
    await expect(service.deletePlay('p1', 't1')).resolves.toBe(true);
  });
});
