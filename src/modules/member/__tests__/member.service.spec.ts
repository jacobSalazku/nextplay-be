import { NotFoundException } from '@nestjs/common';
import { Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { MemberService } from '../member.service';

type Args = { where?: Record<string, unknown>; data?: Record<string, unknown> };

const memberFindFirst = jest.fn<Promise<{ id: string } | null>, [Args]>();
const memberUpdate = jest.fn<Promise<unknown>, [Args]>();
const statlineDeleteMany = jest.fn<Promise<{ count: number }>, [Args]>();

const prisma = {
  member: { findFirst: memberFindFirst, update: memberUpdate },
  statline: { deleteMany: statlineDeleteMany },
} as unknown as PrismaService;

describe('MemberService.deleteMember', () => {
  let service: MemberService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MemberService(prisma);
  });

  it('soft-deletes the member by marking it REMOVED, keeping its statlines', async () => {
    memberFindFirst.mockResolvedValue({ id: 'm1' });
    memberUpdate.mockResolvedValue({});

    await expect(service.deleteMember('m1', 't1')).resolves.toBe(true);

    expect(memberFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'm1', teamId: 't1' } }),
    );
    expect(memberUpdate).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: Status.REMOVED },
    });
    expect(statlineDeleteMany).not.toHaveBeenCalled();
  });

  it('throws NotFound and updates nothing when the member is on another team', async () => {
    memberFindFirst.mockResolvedValue(null);

    await expect(service.deleteMember('m1', 't1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(memberUpdate).not.toHaveBeenCalled();
  });
});
