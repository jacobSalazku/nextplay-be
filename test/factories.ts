import {
  Role,
  Status,
  type Member,
  type Team,
  type User,
} from '@prisma/client';
import { testPrisma } from './db';

let seq = 0;
const uniq = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function makeUser(overrides: Partial<User> = {}): Promise<User> {
  const id = uniq();
  return testPrisma.user.create({
    data: {
      name: `Test User ${id}`,
      email: `user-${id}@test.local`,
      hasOnBoarded: true,
      ...overrides,
    },
  });
}

export function makeTeam(
  overrides: { creatorId: string } & Partial<Team>,
): Promise<Team> {
  const id = uniq();
  return testPrisma.team.create({
    data: {
      name: `Test Team ${id}`,
      code: `T-${id}`.toUpperCase().slice(0, 20),
      slug: `team-${id}`,
      shortId: `s-${id}`,
      routeKey: `team-${id}`,
      ageGroup: 'U18',
      ...overrides,
    },
  });
}

export function makeMember(
  overrides: { userId: string; teamId: string } & Partial<Member>,
): Promise<Member> {
  return testPrisma.member.create({
    data: {
      role: Role.PLAYER,
      status: Status.ACTIVE,
      ...overrides,
    },
  });
}

/** A user + team + ACTIVE membership in one call. */
export async function makeTeamWithMember(
  memberOverrides: Partial<Member> = {},
): Promise<{ user: User; team: Team; member: Member }> {
  const user = await makeUser();
  const team = await makeTeam({ creatorId: user.id });
  const member = await makeMember({
    userId: user.id,
    teamId: team.id,
    ...memberOverrides,
  });
  return { user, team, member };
}
