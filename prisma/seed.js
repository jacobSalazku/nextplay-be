/* eslint-disable no-console */
require('dotenv/config');

const { PrismaPg } = require('@prisma/adapter-pg');
const {
  PrismaClient,
  Role,
  Status,
  ActivityType,
  AttendanceStatus,
  PracticeType,
  Location,
  Category,
} = require('@prisma/client');

const TEAM_ROUTE_KEY = 'cavs-173c3e20';
const TEAM_SHORT_ID = '173c3e20';
const TEAM_CODE = 'CAVS26';

const COACH_SEED = [
  {
    name: 'Coach Mia Carter',
    email: 'coach.cavs@nextplay.test',
    phone: '+32000000001',
    dominantHand: 'RIGHT',
    dob: '1987-06-12',
  },
  {
    name: 'Coach Aaron Mills',
    email: 'assistant.coach@nextplay.test',
    phone: '+32000000002',
    dominantHand: 'LEFT',
    dob: '1990-02-08',
  },
];

const PLAYER_SEED = [
  {
    name: 'Jay Mason',
    email: 'player.1@nextplay.test',
    number: '4',
    position: 'PG',
    height: 183,
    weight: 78,
    dominantHand: 'RIGHT',
  },
  {
    name: 'Noah Kim',
    email: 'player.2@nextplay.test',
    number: '7',
    position: 'SG',
    height: 188,
    weight: 80,
    dominantHand: 'LEFT',
  },
  {
    name: 'Luca Vermeer',
    email: 'player.3@nextplay.test',
    number: '9',
    position: 'SF',
    height: 194,
    weight: 86,
    dominantHand: 'RIGHT',
  },
  {
    name: 'Evan Brooks',
    email: 'player.4@nextplay.test',
    number: '11',
    position: 'PF',
    height: 200,
    weight: 93,
    dominantHand: 'RIGHT',
  },
  {
    name: 'Milo Jensen',
    email: 'player.5@nextplay.test',
    number: '13',
    position: 'C',
    height: 206,
    weight: 101,
    dominantHand: 'LEFT',
  },
  {
    name: 'Rayan Nouri',
    email: 'player.6@nextplay.test',
    number: '15',
    position: 'SG',
    height: 186,
    weight: 79,
    dominantHand: 'RIGHT',
  },
  {
    name: 'Owen Dumas',
    email: 'player.7@nextplay.test',
    number: '18',
    position: 'SF',
    height: 192,
    weight: 84,
    dominantHand: 'LEFT',
  },
  {
    name: 'Kai Moreau',
    email: 'player.8@nextplay.test',
    number: '22',
    position: 'PF',
    height: 198,
    weight: 91,
    dominantHand: 'RIGHT',
  },
  {
    name: 'Tyrese Cole',
    email: 'player.9@nextplay.test',
    number: '24',
    position: 'C',
    height: 204,
    weight: 99,
    dominantHand: 'RIGHT',
  },
  {
    name: 'Dylan Rossi',
    email: 'player.10@nextplay.test',
    number: '27',
    position: 'PG',
    height: 181,
    weight: 76,
    dominantHand: 'LEFT',
  },
  {
    name: 'Nico Perez',
    email: 'player.11@nextplay.test',
    number: '30',
    position: 'SG',
    height: 189,
    weight: 81,
    dominantHand: 'RIGHT',
  },
  {
    name: 'Samir Haddad',
    email: 'player.12@nextplay.test',
    number: '33',
    position: 'SF',
    height: 196,
    weight: 88,
    dominantHand: 'LEFT',
  },
];

const EXTRA_MEMBER_USERS = [
  {
    name: 'Alex Pending',
    email: 'pending.joiner@nextplay.test',
    status: Status.PENDING,
    number: '99',
    position: 'SG',
  },
  {
    name: 'Liam Pending',
    email: 'pending.joiner.2@nextplay.test',
    status: Status.PENDING,
    number: '98',
    position: 'PF',
  },
  {
    name: 'Chris Inactive',
    email: 'inactive.player@nextplay.test',
    status: Status.INACTIVE,
    number: '55',
    position: 'SF',
  },
];

function daysFromNow(days, hour = 19, minute = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function hoursFromNow(hours) {
  const date = new Date();
  date.setHours(date.getHours() + hours, 0, 0, 0);
  return date;
}

function formatActivityTime(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}

function createDateOfBirth(index) {
  const month = String((index % 9) + 1).padStart(2, '0');
  const day = String((index % 19) + 10).padStart(2, '0');
  return new Date(`2007-${month}-${day}`);
}

function pickAttendanceStatus(memberIndex, activityIndex, activityType) {
  // Games are stricter: mostly ATTENDING, small chance of LATE/NOT_ATTENDING.
  if (activityType === ActivityType.GAME) {
    if ((memberIndex + activityIndex) % 10 === 0) return AttendanceStatus.LATE;
    if ((memberIndex + activityIndex) % 13 === 0) {
      return AttendanceStatus.NOT_ATTENDING;
    }
    return AttendanceStatus.ATTENDING;
  }

  // Practices are more mixed.
  if ((memberIndex + activityIndex) % 7 === 0) return AttendanceStatus.LATE;
  if ((memberIndex + activityIndex) % 9 === 0) {
    return AttendanceStatus.NOT_ATTENDING;
  }
  return AttendanceStatus.ATTENDING;
}

function getAttendanceReason(status, activityType) {
  if (status !== AttendanceStatus.NOT_ATTENDING) return null;
  if (activityType === ActivityType.GAME) return 'Injury management';
  return 'School exam / family event';
}

function buildOpponentBaseline(index) {
  return {
    fieldGoalsMade: 20 + (index % 9),
    threePointersMade: 4 + (index % 6),
    freeThrowsMade: 8 + (index % 8),
  };
}

function buildStatline(memberIndex, gameIndex) {
  // Different player archetypes produce different stat shapes.
  const guardBias = memberIndex % 3 === 0;
  const wingBias = memberIndex % 3 === 1;
  const bigBias = memberIndex % 3 === 2;

  const fieldGoalsMade = guardBias
    ? 3 + (gameIndex % 3)
    : 4 + (memberIndex % 4);
  const threePointersMade = guardBias
    ? 2 + (gameIndex % 2)
    : wingBias
      ? 1 + (memberIndex % 2)
      : 0 + (gameIndex % 2);
  const assists = guardBias ? 4 + (memberIndex % 4) : 1 + (memberIndex % 3);
  const steals = guardBias ? 1 + (gameIndex % 2) : memberIndex % 2;
  const offensiveRebounds = bigBias ? 3 + (memberIndex % 2) : memberIndex % 2;
  const defensiveRebounds = bigBias
    ? 5 + (memberIndex % 3)
    : 2 + ((memberIndex + gameIndex) % 4);
  const blocks = bigBias ? 2 + (gameIndex % 2) : memberIndex % 2;
  const turnovers = 1 + ((memberIndex + gameIndex) % 4);

  const fieldGoalsMissed = 3 + ((memberIndex + gameIndex) % 5);
  const threePointersMissed = 1 + ((memberIndex + gameIndex) % 4);
  const freeThrows = 1 + ((memberIndex + gameIndex) % 4);
  const freeThrowsMissed = (memberIndex + gameIndex) % 2;

  return {
    fieldGoalsMade,
    fieldGoalsMissed,
    threePointersMade,
    threePointersMissed,
    freeThrows,
    freeThrowsMissed,
    assists,
    steals,
    turnovers,
    offensiveRebounds,
    defensiveRebounds,
    blocks,
  };
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing DATABASE_URL in environment.');
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    const existingTeam = await prisma.team.findUnique({
      where: { routeKey: TEAM_ROUTE_KEY },
      select: { id: true },
    });

    if (existingTeam) {
      await prisma.team.delete({ where: { id: existingTeam.id } });
    }

    const seedEmails = [
      ...COACH_SEED.map((coach) => coach.email),
      ...PLAYER_SEED.map((player) => player.email),
      ...EXTRA_MEMBER_USERS.map((user) => user.email),
    ];

    await prisma.user.deleteMany({
      where: { email: { in: seedEmails } },
    });

    const coaches = [];
    for (const coach of COACH_SEED) {
      const createdCoach = await prisma.user.create({
        data: {
          name: coach.name,
          email: coach.email,
          hasOnBoarded: true,
          dominantHand: coach.dominantHand,
          phone: coach.phone,
          dateOfBirth: new Date(coach.dob),
        },
      });
      coaches.push(createdCoach);
    }

    const players = [];
    for (let i = 0; i < PLAYER_SEED.length; i += 1) {
      const playerSeed = PLAYER_SEED[i];
      const createdPlayer = await prisma.user.create({
        data: {
          name: playerSeed.name,
          email: playerSeed.email,
          hasOnBoarded: true,
          dominantHand: playerSeed.dominantHand,
          height: playerSeed.height,
          weight: playerSeed.weight,
          phone: `+32000000${String(i + 10).padStart(3, '0')}`,
          dateOfBirth: createDateOfBirth(i),
        },
      });
      players.push({ ...playerSeed, id: createdPlayer.id });
    }

    const extraUsers = [];
    for (const extraUser of EXTRA_MEMBER_USERS) {
      const createdExtra = await prisma.user.create({
        data: {
          name: extraUser.name,
          email: extraUser.email,
          hasOnBoarded: true,
          dominantHand: 'RIGHT',
        },
      });
      extraUsers.push({ ...extraUser, id: createdExtra.id });
    }

    const team = await prisma.team.create({
      data: {
        name: 'Cleveland CAVS U18',
        code: TEAM_CODE,
        slug: 'cleveland-cavs-u18',
        shortId: TEAM_SHORT_ID,
        routeKey: TEAM_ROUTE_KEY,
        ageGroup: 'U18',
        creatorId: coaches[0].id,
        image: null,
      },
    });

    const coachMembers = [];
    for (const coach of coaches) {
      const member = await prisma.member.create({
        data: {
          userId: coach.id,
          teamId: team.id,
          role: Role.COACH,
          status: Status.ACTIVE,
        },
      });
      coachMembers.push(member);
    }

    const playerMembers = [];
    for (const player of players) {
      const member = await prisma.member.create({
        data: {
          userId: player.id,
          teamId: team.id,
          role: Role.PLAYER,
          status: Status.ACTIVE,
          number: player.number,
          position: player.position,
        },
      });
      playerMembers.push(member);
    }

    for (const extraUser of extraUsers) {
      await prisma.member.create({
        data: {
          userId: extraUser.id,
          teamId: team.id,
          role: Role.PLAYER,
          status: extraUser.status,
          number: extraUser.number,
          position: extraUser.position,
        },
      });
    }

    const activities = [];
    const games = [];
    const practices = [];
    const boxScoreGameIds = [];
    const fullAttendanceActivityIds = new Set();

    const practiceSeed = [
      {
        title: 'Ball Handling + Transition',
        dayOffset: -96,
        time: '18:30',
        hour: 18,
        minute: 30,
        duration: 1.5,
        facility: 'North Hall',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Physical Conditioning Block',
        dayOffset: -88,
        time: '19:00',
        hour: 19,
        minute: 0,
        duration: 1.5,
        facility: 'Strength Room',
        practiceType: PracticeType.PHYSICAL,
      },
      {
        title: 'Set Plays + Shooting',
        dayOffset: -80,
        time: '19:00',
        hour: 19,
        minute: 0,
        duration: 1.75,
        facility: 'Main Court',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Guard Skill Development',
        dayOffset: -73,
        time: '18:45',
        hour: 18,
        minute: 45,
        duration: 1.5,
        facility: 'Skills Gym',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Team Defense Rotations',
        dayOffset: -66,
        time: '19:15',
        hour: 19,
        minute: 15,
        duration: 1.5,
        facility: 'East Gym',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Finishing + Free Throws',
        dayOffset: -59,
        time: '18:40',
        hour: 18,
        minute: 40,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Explosive Movement Session',
        dayOffset: -52,
        time: '19:10',
        hour: 19,
        minute: 10,
        duration: 1.25,
        facility: 'Performance Lab',
        practiceType: PracticeType.PHYSICAL,
      },
      {
        title: 'Bigs Post Footwork Lab',
        dayOffset: -45,
        time: '18:50',
        hour: 18,
        minute: 50,
        duration: 1.25,
        facility: 'Skills Gym',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Closeout + Rebound Concepts',
        dayOffset: -38,
        time: '19:05',
        hour: 19,
        minute: 5,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Read & React Shooting',
        dayOffset: -31,
        time: '18:35',
        hour: 18,
        minute: 35,
        duration: 1.5,
        facility: 'North Hall',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Acceleration + Core Session',
        dayOffset: -24,
        time: '19:20',
        hour: 19,
        minute: 20,
        duration: 1.25,
        facility: 'Performance Lab',
        practiceType: PracticeType.PHYSICAL,
      },
      {
        title: 'Wing Decision-Making Series',
        dayOffset: -18,
        time: '18:55',
        hour: 18,
        minute: 55,
        duration: 1.5,
        facility: 'Skills Gym',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Press Break Rehearsal',
        dayOffset: -16,
        time: '19:05',
        hour: 19,
        minute: 5,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Passing Tempo + Vision',
        dayOffset: -12,
        time: '19:00',
        hour: 19,
        minute: 0,
        duration: 1.5,
        facility: 'North Hall',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Shot Quality Review',
        dayOffset: -10,
        time: '18:45',
        hour: 18,
        minute: 45,
        duration: 1.25,
        facility: 'Video Room',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Pick & Roll Decision Lab',
        dayOffset: -7,
        time: '18:50',
        hour: 18,
        minute: 50,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Defensive Shell Reset',
        dayOffset: -6,
        time: '19:15',
        hour: 19,
        minute: 15,
        duration: 1.5,
        facility: 'East Gym',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Free Throw Pressure Ladder',
        dayOffset: -5,
        time: '18:35',
        hour: 18,
        minute: 35,
        duration: 1.25,
        facility: 'North Hall',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Scrimmage Install Night',
        dayOffset: -3,
        time: '19:10',
        hour: 19,
        minute: 10,
        duration: 1.75,
        facility: 'East Gym',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Opponent Scout Walkthrough',
        dayOffset: -2,
        time: '18:25',
        hour: 18,
        minute: 25,
        duration: 1,
        facility: 'Video Room',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Film Review + Walkthrough',
        dayOffset: -1,
        time: '18:30',
        hour: 18,
        minute: 30,
        duration: 1,
        facility: 'Video Room',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Game Day Activation',
        dayOffset: 0,
        time: '17:30',
        hour: 17,
        minute: 30,
        duration: 1.25,
        facility: 'Performance Lab',
        practiceType: PracticeType.PHYSICAL,
      },
      {
        title: 'Tomorrow Shooting Tune-Up',
        dayOffset: 1,
        time: '18:15',
        hour: 18,
        minute: 15,
        duration: 1.25,
        facility: 'North Hall',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Scout Prep: Zone Looks',
        dayOffset: 2,
        time: '19:05',
        hour: 19,
        minute: 5,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Box-Out Battles',
        dayOffset: 4,
        time: '18:55',
        hour: 18,
        minute: 55,
        duration: 1.5,
        facility: 'East Gym',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'BLOB/SLOB Special Teams',
        dayOffset: 6,
        time: '19:20',
        hour: 19,
        minute: 20,
        duration: 1.25,
        facility: 'Main Court',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Recovery + Shooting Touch',
        dayOffset: 3,
        time: '18:40',
        hour: 18,
        minute: 40,
        duration: 1.25,
        facility: 'North Hall',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Tempo Scrimmage',
        dayOffset: 5,
        time: '19:00',
        hour: 19,
        minute: 0,
        duration: 1.75,
        facility: 'Main Court',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Halfcourt Offensive Sets',
        dayOffset: 8,
        time: '19:00',
        hour: 19,
        minute: 0,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Weak-Side Help Clinic',
        dayOffset: 10,
        time: '18:50',
        hour: 18,
        minute: 50,
        duration: 1.5,
        facility: 'Skills Gym',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Advantage Creation Shooting',
        dayOffset: 12,
        time: '19:05',
        hour: 19,
        minute: 5,
        duration: 1.5,
        facility: 'North Hall',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Late-Game Situations',
        dayOffset: 14,
        time: '19:20',
        hour: 19,
        minute: 20,
        duration: 1.5,
        facility: 'East Gym',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Transition Offense Sprint',
        dayOffset: 17,
        time: '18:45',
        hour: 18,
        minute: 45,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'Transition Defense Emphasis',
        dayOffset: 21,
        time: '18:45',
        hour: 18,
        minute: 45,
        duration: 1.5,
        facility: 'Skills Gym',
        practiceType: PracticeType.TEAM,
      },
      {
        title: 'End-of-Month Skills Combine',
        dayOffset: 24,
        time: '19:00',
        hour: 19,
        minute: 0,
        duration: 1.5,
        facility: 'Performance Lab',
        practiceType: PracticeType.PHYSICAL,
      },
      {
        title: 'Mid-Range + Paint Finishing',
        dayOffset: 30,
        time: '18:35',
        hour: 18,
        minute: 35,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.SHOOTING,
      },
      {
        title: 'Strength Rebuild Circuit',
        dayOffset: 42,
        time: '19:10',
        hour: 19,
        minute: 10,
        duration: 1.25,
        facility: 'Strength Room',
        practiceType: PracticeType.PHYSICAL,
      },
      {
        title: 'Ball Screen Coverage Clinic',
        dayOffset: 56,
        time: '19:05',
        hour: 19,
        minute: 5,
        duration: 1.5,
        facility: 'North Hall',
        practiceType: PracticeType.SPECIALISATION,
      },
      {
        title: 'Summer Team Build Session',
        dayOffset: 72,
        time: '18:55',
        hour: 18,
        minute: 55,
        duration: 1.5,
        facility: 'Main Court',
        practiceType: PracticeType.TEAM,
      },
    ];

    for (const practice of practiceSeed) {
      const createdPractice = await prisma.activity.create({
        data: {
          teamId: team.id,
          type: ActivityType.PRACTICE,
          title: practice.title,
          date: daysFromNow(practice.dayOffset, practice.hour, practice.minute),
          time: practice.time,
          duration: practice.duration,
          practice: {
            create: {
              facility: practice.facility,
              practicetype: practice.practiceType,
            },
          },
        },
        include: { practice: true },
      });
      activities.push(createdPractice);
      practices.push({
        id: createdPractice.id,
        dayOffset: practice.dayOffset,
        title: practice.title,
      });
    }

    const gameSeed = [
      {
        title: 'vs River Hawks',
        opponent: 'River Hawks',
        dayOffset: -94,
        time: '20:00',
        hour: 20,
        minute: 0,
        location: Location.HOME,
      },
      {
        title: 'at Downtown Bulls',
        opponent: 'Downtown Bulls',
        dayOffset: -85,
        time: '19:45',
        hour: 19,
        minute: 45,
        location: Location.AWAY,
      },
      {
        title: 'vs Highland Storm',
        opponent: 'Highland Storm',
        dayOffset: -76,
        time: '19:30',
        hour: 19,
        minute: 30,
        location: Location.HOME,
      },
      {
        title: 'at City Lions',
        opponent: 'City Lions',
        dayOffset: -67,
        time: '19:30',
        hour: 19,
        minute: 30,
        location: Location.AWAY,
      },
      {
        title: 'vs Metro Giants',
        opponent: 'Metro Giants',
        dayOffset: -58,
        time: '20:15',
        hour: 20,
        minute: 15,
        location: Location.HOME,
      },
      {
        title: 'at North Raiders',
        opponent: 'North Raiders',
        dayOffset: -49,
        time: '20:00',
        hour: 20,
        minute: 0,
        location: Location.AWAY,
      },
      {
        title: 'vs Harbor Kings',
        opponent: 'Harbor Kings',
        dayOffset: -40,
        time: '18:30',
        hour: 18,
        minute: 30,
        location: Location.HOME,
      },
      {
        title: 'at West Falcons',
        opponent: 'West Falcons',
        dayOffset: -32,
        time: '19:20',
        hour: 19,
        minute: 20,
        location: Location.AWAY,
      },
      {
        title: 'vs Valley Titans',
        opponent: 'Valley Titans',
        dayOffset: -25,
        time: '19:10',
        hour: 19,
        minute: 10,
        location: Location.HOME,
      },
      {
        title: 'at Pine Rockets',
        opponent: 'Pine Rockets',
        dayOffset: -18,
        time: '19:50',
        hour: 19,
        minute: 50,
        location: Location.AWAY,
      },
      {
        title: 'vs Namur Hawks',
        opponent: 'Namur Hawks',
        dayOffset: -16,
        time: '18:40',
        hour: 18,
        minute: 40,
        location: Location.HOME,
      },
      {
        title: 'at Aalst Giants',
        opponent: 'Aalst Giants',
        dayOffset: -14,
        time: '19:25',
        hour: 19,
        minute: 25,
        location: Location.AWAY,
      },
      {
        title: 'vs Steel Comets',
        opponent: 'Steel Comets',
        dayOffset: -11,
        time: '20:05',
        hour: 20,
        minute: 5,
        location: Location.HOME,
      },
      {
        title: 'vs Hasselt Heat',
        opponent: 'Hasselt Heat',
        dayOffset: -9,
        time: '18:55',
        hour: 18,
        minute: 55,
        fullAttendance: true,
        location: Location.HOME,
      },
      {
        title: 'at Bruges Royals',
        opponent: 'Bruges Royals',
        dayOffset: -7,
        time: '19:45',
        hour: 19,
        minute: 45,
        location: Location.AWAY,
      },
      {
        title: 'vs Mons Miners',
        opponent: 'Mons Miners',
        dayOffset: -5,
        time: '20:10',
        hour: 20,
        minute: 10,
        location: Location.HOME,
      },
      {
        title: 'at Lakeside Knights',
        opponent: 'Lakeside Knights',
        dayOffset: -4,
        time: '18:30',
        hour: 18,
        minute: 30,
        location: Location.AWAY,
      },
      {
        title: 'at Liege Panthers',
        opponent: 'Liege Panthers',
        dayOffset: -3,
        time: '19:15',
        hour: 19,
        minute: 15,
        fullAttendance: true,
        location: Location.AWAY,
      },
      {
        title: 'vs Antwerp Aces',
        opponent: 'Antwerp Aces',
        dayOffset: -2,
        time: '19:35',
        hour: 19,
        minute: 35,
        fullAttendance: true,
        location: Location.HOME,
      },
      {
        title: 'at Mechelen Eagles',
        opponent: 'Mechelen Eagles',
        dayOffset: -1,
        time: '18:55',
        hour: 18,
        minute: 55,
        location: Location.AWAY,
      },
      {
        title: 'vs Brussels Falcons',
        opponent: 'Brussels Falcons',
        relativeHours: -2,
        fullAttendance: true,
        location: Location.HOME,
      },
      {
        title: 'vs Belgian Lions Select',
        opponent: 'Belgian Lions Select',
        relativeHours: 1,
        mixedAttendance: true,
        location: Location.HOME,
      },
      {
        title: 'vs Central Cobras',
        opponent: 'Central Cobras',
        relativeHours: 4,
        location: Location.HOME,
      },
      {
        title: 'vs Charleroi Tigers',
        opponent: 'Charleroi Tigers',
        dayOffset: 1,
        time: '17:45',
        hour: 17,
        minute: 45,
        location: Location.HOME,
      },
      {
        title: 'at Leuven Bears',
        opponent: 'Leuven Bears',
        dayOffset: 1,
        time: '19:30',
        hour: 19,
        minute: 30,
        location: Location.AWAY,
      },
      {
        title: 'vs Ghent Wolves',
        opponent: 'Ghent Wolves',
        dayOffset: 2,
        time: '18:45',
        hour: 18,
        minute: 45,
        location: Location.HOME,
      },
      {
        title: 'at Limburg United',
        opponent: 'Limburg United',
        dayOffset: 3,
        time: '20:00',
        hour: 20,
        minute: 0,
        location: Location.AWAY,
      },
      {
        title: 'vs Kortrijk Spurs',
        opponent: 'Kortrijk Spurs',
        dayOffset: 4,
        time: '19:15',
        hour: 19,
        minute: 15,
        location: Location.HOME,
      },
      {
        title: 'at Ostend Waves',
        opponent: 'Ostend Waves',
        dayOffset: 5,
        time: '18:35',
        hour: 18,
        minute: 35,
        location: Location.AWAY,
      },
      {
        title: 'at Blue Sharks',
        opponent: 'Blue Sharks',
        dayOffset: 6,
        time: '19:45',
        hour: 19,
        minute: 45,
        location: Location.AWAY,
      },
      {
        title: 'vs Academy Select',
        opponent: 'Academy Select',
        dayOffset: 8,
        time: '20:00',
        hour: 20,
        minute: 0,
        location: Location.HOME,
      },
      {
        title: 'at Genk Blazers',
        opponent: 'Genk Blazers',
        dayOffset: 10,
        time: '19:20',
        hour: 19,
        minute: 20,
        location: Location.AWAY,
      },
      {
        title: 'vs Waterloo Knights',
        opponent: 'Waterloo Knights',
        dayOffset: 12,
        time: '18:50',
        hour: 18,
        minute: 50,
        location: Location.HOME,
      },
      {
        title: 'vs East Panthers',
        opponent: 'East Panthers',
        dayOffset: 13,
        time: '20:10',
        hour: 20,
        minute: 10,
        location: Location.HOME,
      },
      {
        title: 'at Liege Academy',
        opponent: 'Liege Academy',
        dayOffset: 15,
        time: '19:55',
        hour: 19,
        minute: 55,
        location: Location.AWAY,
      },
      {
        title: 'vs Belgian Prospects',
        opponent: 'Belgian Prospects',
        dayOffset: 18,
        time: '18:45',
        hour: 18,
        minute: 45,
        location: Location.HOME,
      },
      {
        title: 'at Iron Wolves',
        opponent: 'Iron Wolves',
        dayOffset: 20,
        time: '19:35',
        hour: 19,
        minute: 35,
        location: Location.AWAY,
      },
      {
        title: 'vs Golden Falcons',
        opponent: 'Golden Falcons',
        dayOffset: 34,
        time: '18:50',
        hour: 18,
        minute: 50,
        location: Location.HOME,
      },
      {
        title: 'at Red Vipers',
        opponent: 'Red Vipers',
        dayOffset: 48,
        time: '19:40',
        hour: 19,
        minute: 40,
        location: Location.AWAY,
      },
      {
        title: 'vs Black Foxes',
        opponent: 'Black Foxes',
        dayOffset: 63,
        time: '20:00',
        hour: 20,
        minute: 0,
        location: Location.HOME,
      },
      {
        title: 'at White Eagles',
        opponent: 'White Eagles',
        dayOffset: 79,
        time: '19:25',
        hour: 19,
        minute: 25,
        location: Location.AWAY,
      },
    ];

    for (let i = 0; i < gameSeed.length; i += 1) {
      const game = gameSeed[i];
      const gameDate =
        typeof game.relativeHours === 'number'
          ? hoursFromNow(game.relativeHours)
          : daysFromNow(game.dayOffset, game.hour, game.minute);
      const isFutureGame = gameDate > new Date();

      const createdGame = await prisma.activity.create({
        data: {
          teamId: team.id,
          type: ActivityType.GAME,
          title: game.title,
          date: gameDate,
          time: game.time ?? formatActivityTime(gameDate),
          duration: 2,
          game: {
            create: { location: game.location },
          },
        },
        include: { game: true },
      });

      activities.push(createdGame);
      if (!game.mixedAttendance) {
        fullAttendanceActivityIds.add(createdGame.id);
      }
      boxScoreGameIds.push(createdGame.id);

      games.push({
        id: createdGame.id,
        opponent: game.opponent,
        dayOffset: game.dayOffset ?? 0,
        isFuture: isFutureGame,
      });

      const opponentBaseline = buildOpponentBaseline(i);
      await prisma.opponentStatline.create({
        data: {
          gameId: createdGame.id,
          name: game.opponent,
          ...opponentBaseline,
        },
      });
    }

    for (
      let activityIndex = 0;
      activityIndex < activities.length;
      activityIndex += 1
    ) {
      const activity = activities[activityIndex];
      for (
        let memberIndex = 0;
        memberIndex < playerMembers.length;
        memberIndex += 1
      ) {
        const member = playerMembers[memberIndex];
        const status = fullAttendanceActivityIds.has(activity.id)
          ? AttendanceStatus.ATTENDING
          : pickAttendanceStatus(memberIndex, activityIndex, activity.type);

        await prisma.playerActivityAttendance.create({
          data: {
            activityId: activity.id,
            memberId: member.id,
            attendanceStatus: status,
            reason: getAttendanceReason(status, activity.type),
          },
        });
      }
    }

    for (
      let gameIndex = 0;
      gameIndex < boxScoreGameIds.length;
      gameIndex += 1
    ) {
      const gameId = boxScoreGameIds[gameIndex];

      for (
        let memberIndex = 0;
        memberIndex < playerMembers.length;
        memberIndex += 1
      ) {
        const member = playerMembers[memberIndex];
        const attendance = await prisma.playerActivityAttendance.findUnique({
          where: {
            activityId_memberId: {
              activityId: gameId,
              memberId: member.id,
            },
          },
          select: { attendanceStatus: true },
        });

        if (attendance?.attendanceStatus !== AttendanceStatus.ATTENDING) {
          continue;
        }

        await prisma.statline.create({
          data: {
            gameId,
            memberId: member.id,
            ...buildStatline(memberIndex, gameIndex),
          },
        });
      }
    }

    const plays = [];
    const playSeed = [
      {
        name: 'Horns Flare Punch',
        category: Category.OFFENSIVE,
        description:
          'Start in horns, hit the elbow, flare the weak-side guard, then punish the help with a post seal or corner three.',
      },
      {
        name: 'Spain Pick & Roll',
        category: Category.OFFENSIVE,
        description:
          'High ball screen with a back-screen on the roller. First read is the roller, second read is the popping screener.',
      },
      {
        name: 'Pistol Keep Action',
        category: Category.OFFENSIVE,
        description:
          'Guard-to-wing pitch, quick handoff keep, and a rim run behind the defense before the weak side can load up.',
      },
      {
        name: '5-Out Delay Split',
        category: Category.OFFENSIVE,
        description:
          'Center catches at the top, guards split around the ball, and wings stay lifted for catch-and-drive reads.',
      },
      {
        name: 'Double Drag Early',
        category: Category.OFFENSIVE,
        description:
          'Two transition screens above the break. First screener rolls hard, second screener pops for spacing.',
      },
      {
        name: 'Ram Spain Counter',
        category: Category.OFFENSIVE,
        description:
          'A ram screen frees the ball screener before flowing into Spain pick-and-roll when teams start switching.',
      },
      {
        name: 'UCLA Rip Seal',
        category: Category.OFFENSIVE,
        description:
          'UCLA cut into a weak-side rip screen. Look for the layup first, then the duck-in seal on the block.',
      },
      {
        name: 'Diamond BLOB Shooter',
        category: Category.SPECIAL,
        description:
          'Diamond alignment under the rim with a zipper cut into a corner screen-the-screener look for your best shooter.',
      },
      {
        name: 'Box Elevator BLOB',
        category: Category.SPECIAL,
        description:
          'Box set with elevator doors at the nail. Use it after timeouts when the defense is denying the first option.',
      },
      {
        name: 'Sideline Stack 4',
        category: Category.SPECIAL,
        description:
          'Stack sideline inbound, pop the first cutter, then slip the back screener if the defense switches early.',
      },
      {
        name: '1-4 Press Break Flash',
        category: Category.SPECIAL,
        description:
          'Four-across press break with a middle flash, deep safety, and reverse-pass trigger against traps.',
      },
      {
        name: 'Late Clock Ghost',
        category: Category.SPECIAL,
        description:
          'Six-second sideline package: ghost screen into a flare while the big dives to occupy the low help.',
      },
      {
        name: 'ICE Side Pick Coverage',
        category: Category.DEFENSIVE,
        description:
          'Force side pick-and-rolls toward the sideline, keep the big in a contain stance, and tag from the low man.',
      },
      {
        name: 'Switch Red + Scram',
        category: Category.DEFENSIVE,
        description:
          'Switch the first action, then scram the small out of the post before the offense can enter the ball.',
      },
      {
        name: 'Pack Line Shell',
        category: Category.DEFENSIVE,
        description:
          'Shrink gaps, show early help, and recover on the pass. Emphasize talk, ball pressure, and rebound finish.',
      },
      {
        name: '2-3 Zone Bump Rules',
        category: Category.DEFENSIVE,
        description:
          'Wing bumps the corner, top guard takes first pass, and the middle owns high-post catches and cutters.',
      },
      {
        name: '1-2-2 Contain Press',
        category: Category.DEFENSIVE,
        description:
          'Soft three-quarter press to burn clock, angle the ball to the sideline, and trap only after the first reversal.',
      },
      {
        name: 'Zone Overload Set',
        category: Category.SPECIAL,
        description:
          'Overload one side of a zone with a short-corner touch, high-post flash, and weak-side skip option.',
      },
    ];

    for (const play of playSeed) {
      const createdPlay = await prisma.play.create({
        data: {
          teamId: team.id,
          name: play.name,
          category: play.category,
          description: play.description,
          canvas: '/placeholder.png',
        },
      });
      plays.push(createdPlay);
    }

    const connectPlayIndexes = (indexes) =>
      indexes
        .map((index) => plays[index])
        .filter(Boolean)
        .map((play) => ({ id: play.id }));

    const upcomingGames = games.filter((game) => game.isFuture);
    const gamePlanTemplates = [
      {
        titlePrefix: 'Game Model',
        notes:
          'Open with pace, get an early paint touch, then flow into horns if transition is stopped. Defensive priority: finish every possession with five bodies rebounding.',
        playIndexes: [4, 0, 12, 14],
      },
      {
        titlePrefix: 'Switch Attack Plan',
        notes:
          'Expect switching on ball screens. Use ghost and Spain counters, then punish mismatches with the rip seal.',
        playIndexes: [1, 5, 6, 13],
      },
      {
        titlePrefix: 'Pressure Prep',
        notes:
          'Opponent likes to trap after dead balls. Keep the middle flash available and organize sideline inbound spacing before the whistle.',
        playIndexes: [10, 9, 16, 11],
      },
      {
        titlePrefix: 'Zone Break Sheet',
        notes:
          'Attack gaps first, then use short-corner overloads. Do not settle for first-pass threes unless feet are set.',
        playIndexes: [17, 15, 3, 8],
      },
      {
        titlePrefix: 'Late-Game Card',
        notes:
          'Use late-clock ghost when the score is tight. Defensively, switch late actions and scram the mismatch before the post touch.',
        playIndexes: [11, 2, 13, 7],
      },
      {
        titlePrefix: 'Tempo Plan',
        notes:
          'Push after misses, run double drag early, and sprint to corners. If the first wave stops, flow into delay split.',
        playIndexes: [4, 3, 2, 14],
      },
      {
        titlePrefix: 'Pressure Package',
        notes:
          'Show the 1-2-2 contain press after made free throws and use box elevator after opponent scoring runs.',
        playIndexes: [16, 8, 10, 12],
      },
      {
        titlePrefix: 'Matchup Notes',
        notes:
          'Attack their smaller guards with horns punch and protect the paint with early pack-line help.',
        playIndexes: [0, 6, 14, 12],
      },
      {
        titlePrefix: 'Coach Card',
        notes:
          'Bench calls: Orange for Spain, Blue for ICE, Fist for late-clock ghost. Keep timeout plays simple and loud.',
        playIndexes: [1, 12, 11, 7],
      },
      {
        titlePrefix: 'Scout Board',
        notes:
          'Opponent loads strong side and gives up weak-side skips. Keep spacing wide and crash from the opposite wing.',
        playIndexes: [3, 17, 5, 15],
      },
      {
        titlePrefix: 'Special Teams Plan',
        notes:
          'Win the possession after timeouts: diamond for shooters, sideline stack for pressure, and contain press after makes.',
        playIndexes: [7, 9, 16, 8],
      },
      {
        titlePrefix: 'Defensive Identity',
        notes:
          'Make the first option hard, shrink the floor on drives, and communicate scram switches before the ball arrives.',
        playIndexes: [14, 13, 12, 15],
      },
    ];

    for (
      let planIndex = 0;
      planIndex < Math.min(upcomingGames.length, gamePlanTemplates.length);
      planIndex += 1
    ) {
      const game = upcomingGames[planIndex];
      const template = gamePlanTemplates[planIndex];
      await prisma.gamePlan.create({
        data: {
          teamId: team.id,
          gameID: game.id,
          title: `${game.opponent} ${template.titlePrefix}`,
          opponent: game.opponent,
          notes: template.notes,
          plays: {
            connect: connectPlayIndexes(template.playIndexes),
          },
        },
      });
    }

    const upcomingPractices = practices
      .filter((practice) => practice.dayOffset >= 0)
      .sort((a, b) => a.dayOffset - b.dayOffset);
    const preparationTemplates = [
      {
        name: 'Defensive Focus Session',
        focus: 'Closeouts + help-side tagging',
        notes:
          'Start with shell drill, add low-man tags, then finish with 5v5 where stops only count after a rebound.',
        playIndexes: [14, 12, 15, 13],
      },
      {
        name: 'Offensive Timing Session',
        focus: 'Secondary break decisions and spacing',
        notes:
          'Install double drag into delay split. Track whether players sprint to corners before the first pass.',
        playIndexes: [4, 3, 2, 0],
      },
      {
        name: 'Ball Screen Solutions',
        focus: 'Reads vs hedge, drop, and switch coverages',
        notes:
          'Progress from guided Spain reads into live 3v3. Finish with switch counters and weak-side spacing.',
        playIndexes: [1, 5, 6, 13],
      },
      {
        name: 'Pressure Break Package',
        focus: 'Inbound spacing and middle flash timing',
        notes:
          'Run 1-4 press break reps from makes and dead balls. Add sideline stack if the ball gets trapped.',
        playIndexes: [10, 9, 16, 11],
      },
      {
        name: 'Finishing Under Contact',
        focus: 'Paint finishing and weak-hand confidence',
        notes:
          'Create advantage with pistol and UCLA cuts, then finish through pads before rotating to free throws.',
        playIndexes: [2, 6, 3, 4],
      },
      {
        name: 'Special Teams Install',
        focus: 'BLOB/SLOB reads and baseline spacing',
        notes:
          'Walk through first, then run pressure reps with clock constraints.',
        playIndexes: [7, 8, 9, 11],
      },
      {
        name: 'Tempo Scrimmage Prep',
        focus: 'Early offense and transition decision-making',
        notes:
          'Score only after paint touch or advantage pass to reward spacing.',
        playIndexes: [4, 0, 3, 2],
      },
      {
        name: 'Weak-Side Rotation Lab',
        focus: 'Low-man help, tag timing, and second effort rebounding',
        notes:
          'Use shell drill variations before controlled 5v5. Reward early tags and clean defensive rebounds.',
        playIndexes: [12, 14, 15, 13],
      },
      {
        name: 'Shooting Confidence Block',
        focus: 'Game-speed spot-ups and relocation threes',
        notes:
          'Use horns flare and diamond BLOB reads to create game-speed catch-and-shoot reps.',
        playIndexes: [0, 7, 8, 3],
      },
      {
        name: 'Late-Game Execution Prep',
        focus: 'Timeout sets, foul game, and final possession spacing',
        notes:
          'Run down 2/up 1 situations with sideline stack, late-clock ghost, and defensive switch calls.',
        playIndexes: [9, 11, 13, 16],
      },
      {
        name: 'Zone Attack Walkthrough',
        focus: 'Short-corner touches and high-post decision making',
        notes:
          'Rep zone overload, then let players call skips, cuts, or short-corner seals based on the weak-side defender.',
        playIndexes: [17, 15, 3, 0],
      },
      {
        name: 'Defensive Pressure Day',
        focus: 'Contain press rhythm and trap discipline',
        notes:
          'Teach when not to trap. Goal is clock pressure, sideline angles, and no middle catches.',
        playIndexes: [16, 12, 14, 10],
      },
    ];

    for (
      let prepIndex = 0;
      prepIndex <
      Math.min(upcomingPractices.length, preparationTemplates.length);
      prepIndex += 1
    ) {
      const practice = upcomingPractices[prepIndex];
      const template = preparationTemplates[prepIndex];
      await prisma.practicePreparation.create({
        data: {
          teamId: team.id,
          practiceId: practice.id,
          name: template.name,
          focus: template.focus,
          notes: template.notes,
          plays: {
            connect: connectPlayIndexes(template.playIndexes),
          },
        },
      });
    }

    console.log('Seed complete');
    console.log(`Team routeKey: ${TEAM_ROUTE_KEY}`);
    console.log(`Team code: ${TEAM_CODE}`);
    console.log(`Coaches seeded: ${coachMembers.length}`);
    console.log(`Active players seeded: ${playerMembers.length}`);
    console.log(`Extra members seeded: ${extraUsers.length}`);
    console.log(`Activities seeded: ${activities.length}`);
    console.log(`Games seeded: ${games.length}`);
    console.log(`Plays seeded: ${plays.length}`);
    console.log('Dev login emails:');
    for (const email of seedEmails) {
      console.log(`- ${email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
