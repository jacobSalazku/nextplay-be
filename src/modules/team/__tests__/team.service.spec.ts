import { Role, Status } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { resetDb, testPrisma } from '../../../../test/db';
import { makeUser } from '../../../../test/factories';
import { TeamService } from '../team.service';

describe('TeamService.createTeam', () => {
  const service = new TeamService(testPrisma as unknown as PrismaService);

  beforeEach(() => resetDb());
  afterAll(() => testPrisma.$disconnect());

  it('creates the team and makes the creator an ACTIVE coach', async () => {
    const user = await makeUser();

    const team = await service.createTeam(
      { name: 'Falcons U18', ageGroup: 'U18' },
      user.id,
    );

    const member = await testPrisma.member.findFirstOrThrow({
      where: { teamId: team.id, userId: user.id },
    });
    expect(member).toMatchObject({
      role: Role.COACH,
      status: Status.ACTIVE,
    });
  });

  it('marks the creator as onboarded', async () => {
    const user = await makeUser({ hasOnBoarded: false });

    await service.createTeam({ name: 'Falcons', ageGroup: 'U16' }, user.id);

    const fresh = await testPrisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(fresh.hasOnBoarded).toBe(true);
  });

  it('derives routeKey as <slug>-<shortId> from the name', async () => {
    const user = await makeUser();

    const team = await service.createTeam(
      { name: 'São Paulo Ballers!', ageGroup: 'U18' },
      user.id,
    );

    expect(team.routeKey).toMatch(/^sao-paulo-ballers-[a-z0-9]{8}$/);
    expect(team.routeKey).toBe(`${team.slug}-${team.shortId}`);
  });

  it('falls back to the "team" slug when the name has no alphanumerics', async () => {
    const user = await makeUser();

    const team = await service.createTeam(
      { name: '---', ageGroup: 'U18' },
      user.id,
    );

    expect(team.slug).toBe('team');
  });

  it('gives each team a distinct code, shortId and routeKey', async () => {
    const user = await makeUser();

    const a = await service.createTeam(
      { name: 'Alpha', ageGroup: 'U18' },
      user.id,
    );
    const b = await service.createTeam(
      { name: 'Alpha', ageGroup: 'U18' },
      user.id,
    );

    expect(a.code).not.toBe(b.code);
    expect(a.shortId).not.toBe(b.shortId);
    expect(a.routeKey).not.toBe(b.routeKey);
  });
});
