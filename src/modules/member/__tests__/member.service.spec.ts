import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { MemberService } from '../member.service';

type Args = { where?: Record<string, unknown> };

const memberFindFirst = jest.fn<Promise<{ id: string } | null>, [Args]>();
const memberDelete = jest.fn<Promise<unknown>, [Args]>();
const statlineDeleteMany = jest.fn<Promise<{ count: number }>, [Args]>();

const prisma = {
  member: { findFirst: memberFindFirst, delete: memberDelete },
  statline: { deleteMany: statlineDeleteMany },
} as unknown as PrismaService;

describe('MemberService.deleteMember', () => {
  let service: MemberService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MemberService(prisma);
  });

  it('deletes the member (and its statlines) when it belongs to the team', async () => {
    memberFindFirst.mockResolvedValue({ id: 'm1' });
    statlineDeleteMany.mockResolvedValue({ count: 3 });
    memberDelete.mockResolvedValue({});

    await expect(service.deleteMember('m1', 't1')).resolves.toBe(true);

    expect(memberFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'm1', teamId: 't1' } }),
    );
    expect(statlineDeleteMany).toHaveBeenCalledWith({
      where: { memberId: 'm1' },
    });
    expect(memberDelete).toHaveBeenCalledWith({ where: { id: 'm1' } });
  });

  it('throws NotFound and deletes nothing when the member is on another team', async () => {
    memberFindFirst.mockResolvedValue(null);

    await expect(service.deleteMember('m1', 't1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(statlineDeleteMany).not.toHaveBeenCalled();
    expect(memberDelete).not.toHaveBeenCalled();
  });
});
