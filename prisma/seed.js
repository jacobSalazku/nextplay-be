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

function buildOpponentBaseline(index, isFuture) {
  if (isFuture) {
    return {
      fieldGoalsMade: 0,
      threePointersMade: 0,
      freeThrowsMade: 0,
    };
  }

  return {
    fieldGoalsMade: 18 + index * 3,
    threePointersMade: 5 + (index % 4),
    freeThrowsMade: 7 + (index % 5),
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
    const pastGameIds = [];

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
        title: 'vs Steel Comets',
        opponent: 'Steel Comets',
        dayOffset: -11,
        time: '20:05',
        hour: 20,
        minute: 5,
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
        title: 'vs Central Cobras',
        opponent: 'Central Cobras',
        dayOffset: 0,
        time: '19:40',
        hour: 19,
        minute: 40,
        location: Location.HOME,
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
        title: 'vs East Panthers',
        opponent: 'East Panthers',
        dayOffset: 13,
        time: '20:10',
        hour: 20,
        minute: 10,
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
      const createdGame = await prisma.activity.create({
        data: {
          teamId: team.id,
          type: ActivityType.GAME,
          title: game.title,
          date: daysFromNow(game.dayOffset, game.hour, game.minute),
          time: game.time,
          duration: 2,
          game: {
            create: { location: game.location },
          },
        },
        include: { game: true },
      });

      activities.push(createdGame);
      games.push({
        id: createdGame.id,
        opponent: game.opponent,
        dayOffset: game.dayOffset,
        isFuture: game.dayOffset > 0,
      });

      if (game.dayOffset < 0) {
        pastGameIds.push(createdGame.id);
      }

      const opponentBaseline = buildOpponentBaseline(i, game.dayOffset >= 0);
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
        const status = pickAttendanceStatus(
          memberIndex,
          activityIndex,
          activity.type,
        );

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

    for (let gameIndex = 0; gameIndex < pastGameIds.length; gameIndex += 1) {
      const gameId = pastGameIds[gameIndex];

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
        name: 'Horns Entry',
        category: Category.OFFENSIVE,
        description: 'Two high posts, wing cut and kick-out read.',
      },
      {
        name: 'Spain Pick & Roll',
        category: Category.OFFENSIVE,
        description: 'Ball screen plus back-screen on the roller.',
      },
      {
        name: 'Elbow Split Action',
        category: Category.OFFENSIVE,
        description: 'Elbow touch then split for weak-side flare.',
      },
      {
        name: '2-3 Matchup Press Break',
        category: Category.SPECIAL,
        description: 'Middle flash, reverse and baseline release.',
      },
      {
        name: 'Baseline Out Of Bounds 21',
        category: Category.SPECIAL,
        description: 'Stack cut to corner then high-low seal.',
      },
      {
        name: 'ICE Side Pick Coverage',
        category: Category.DEFENSIVE,
        description: 'Force to sideline and keep screen defender deep.',
      },
      {
        name: 'Switch + Scram Coverage',
        category: Category.DEFENSIVE,
        description: 'Switch early then scram mismatch from the post.',
      },
      {
        name: 'Zone Overload Set',
        category: Category.SPECIAL,
        description: 'Overload one side with short-corner read.',
      },
    ];

    for (const play of playSeed) {
      const createdPlay = await prisma.play.create({
        data: {
          teamId: team.id,
          name: play.name,
          category: play.category,
          description: play.description,
          canvas: '{"version":"1.0","objects":[]}',
        },
      });
      plays.push(createdPlay);
    }

    const upcomingGames = games.filter((game) => game.dayOffset >= 0);
    const gamePlanTemplates = [
      {
        titlePrefix: 'Match Plan',
        notes: 'Target early paint touches and protect defensive rebounds.',
        playSlice: [0, 4],
      },
      {
        titlePrefix: 'Tactical Prep',
        notes: 'Mix zone looks and attack weak-side closeouts.',
        playSlice: [3, 7],
      },
      {
        titlePrefix: 'Scouting Focus',
        notes: 'Emphasize transition defense and weak-side tag discipline.',
        playSlice: [1, 5],
      },
      {
        titlePrefix: 'Execution Sheet',
        notes: 'Late-clock actions and high-ball screen counters.',
        playSlice: [2, 6],
      },
      {
        titlePrefix: 'Final Details',
        notes: 'Opening set package and matchup-based coverages.',
        playSlice: [0, 3],
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
            connect: plays
              .slice(template.playSlice[0], template.playSlice[1])
              .map((play) => ({ id: play.id })),
          },
        },
      });
    }

    const upcomingPractices = practices.filter(
      (practice) => practice.dayOffset >= 0,
    );
    const preparationTemplates = [
      {
        name: 'Defensive Focus Session',
        focus: 'Closeouts + help-side tagging',
        notes: '30 mins shell drill, then 5v5 situational.',
        playSlice: [4, 8],
      },
      {
        name: 'Offensive Timing Session',
        focus: 'Secondary break decisions and spacing',
        notes: 'Add quick-hitter installs and late-clock options.',
        playSlice: [0, 3],
      },
      {
        name: 'Ball Screen Solutions',
        focus: 'Reads vs hedge, drop, and switch coverages',
        notes: 'Progression from guided reps into constrained scrimmage.',
        playSlice: [1, 5],
      },
      {
        name: 'Pressure Break Package',
        focus: 'Inbound spacing and middle flash timing',
        notes: 'Short-clock pressure reps and turnover response drills.',
        playSlice: [3, 7],
      },
      {
        name: 'Finishing Under Contact',
        focus: 'Paint finishing and weak-hand confidence',
        notes: 'Layer contested finishing after advantage creation actions.',
        playSlice: [2, 6],
      },
    ];

    for (
      let prepIndex = 0;
      prepIndex < Math.min(upcomingPractices.length, preparationTemplates.length);
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
            connect: plays
              .slice(template.playSlice[0], template.playSlice[1])
              .map((play) => ({ id: play.id })),
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
