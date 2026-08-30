import {
  ActivityType,
  Location,
  PracticeType,
  type Team,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { resetDb, testPrisma } from '../../../test/db';
import { makeTeam, makeUser } from '../../../test/factories';
import { ActivityBuilder } from './activity.builder';

const base = {
  title: 'Session',
  time: '19:00',
  duration: 1.5,
  date: new Date('2026-01-01T19:00:00Z'),
  teamId: 'ignored — builder uses the arg',
};

describe('ActivityBuilder', () => {
  const builder = new ActivityBuilder(testPrisma as unknown as PrismaService);
  let team: Team;

  beforeEach(async () => {
    await resetDb();
    const owner = await makeUser();
    team = await makeTeam({ creatorId: owner.id });
  });
  afterAll(() => testPrisma.$disconnect());

  describe('create', () => {
    it('writes the base fields and connects the team', async () => {
      const activity = await builder.create(
        { ...base, type: ActivityType.GAME, location: Location.HOME },
        team.id,
      );

      expect(activity).toMatchObject({
        teamId: team.id,
        type: ActivityType.GAME,
        title: 'Session',
        time: '19:00',
        duration: 1.5,
      });
    });

    it('creates the GAME detail row with its location', async () => {
      const activity = await builder.create(
        { ...base, type: ActivityType.GAME, location: Location.AWAY },
        team.id,
      );

      const game = await testPrisma.game.findUnique({
        where: { activityId: activity.id },
      });
      expect(game?.location).toBe(Location.AWAY);
    });

    it('creates the PRACTICE detail row (practiceType -> practicetype)', async () => {
      const activity = await builder.create(
        {
          ...base,
          type: ActivityType.PRACTICE,
          facility: 'Main Court',
          practiceType: PracticeType.SHOOTING,
        },
        team.id,
      );

      const practice = await testPrisma.practice.findUnique({
        where: { activityId: activity.id },
      });
      expect(practice).toMatchObject({
        facility: 'Main Court',
        practicetype: PracticeType.SHOOTING,
      });
    });

    it('creates FILM / MEETING detail rows with their notes', async () => {
      const film = await builder.create(
        { ...base, type: ActivityType.FILM, notes: 'Opponent set plays' },
        team.id,
      );
      const meeting = await builder.create(
        { ...base, type: ActivityType.MEETING, notes: 'Season kickoff' },
        team.id,
      );

      expect(
        (await testPrisma.film.findUnique({ where: { activityId: film.id } }))
          ?.notes,
      ).toBe('Opponent set plays');
      expect(
        (
          await testPrisma.meeting.findUnique({
            where: { activityId: meeting.id },
          })
        )?.notes,
      ).toBe('Season kickoff');
    });

    it('creates the FEEDBACK detail row with coach + notes', async () => {
      const activity = await builder.create(
        {
          ...base,
          type: ActivityType.FEEDBACK,
          coach: 'Coach Mia',
          notes: 'Great effort',
        },
        team.id,
      );

      const feedback = await testPrisma.feedback.findUnique({
        where: { activityId: activity.id },
      });
      expect(feedback).toMatchObject({
        coach: 'Coach Mia',
        notes: 'Great effort',
      });
    });
  });

  describe('update', () => {
    async function seedGame() {
      return builder.create(
        { ...base, type: ActivityType.GAME, location: Location.HOME },
        team.id,
      );
    }

    it('updates the base fields', async () => {
      const activity = await seedGame();

      const updated = await builder.update(activity.id, {
        id: activity.id,
        teamId: team.id,
        title: 'Renamed',
        time: '20:00',
        duration: 2,
        date: new Date('2026-02-02T20:00:00Z'),
        type: ActivityType.GAME,
      });

      expect(updated).toMatchObject({
        title: 'Renamed',
        time: '20:00',
        duration: 2,
      });
    });

    it('upserts the GAME location when it changes', async () => {
      const activity = await seedGame();

      await builder.update(activity.id, {
        id: activity.id,
        ...base,
        teamId: team.id,
        type: ActivityType.GAME,
        location: Location.AWAY,
      });

      const game = await testPrisma.game.findUnique({
        where: { activityId: activity.id },
      });
      expect(game?.location).toBe(Location.AWAY);
    });

    it('leaves the GAME detail row untouched when location is omitted', async () => {
      const activity = await seedGame();

      await builder.update(activity.id, {
        id: activity.id,
        teamId: team.id,
        title: 'Only the title',
        type: ActivityType.GAME,
      });

      const game = await testPrisma.game.findUnique({
        where: { activityId: activity.id },
      });
      expect(game?.location).toBe(Location.HOME);
    });

    it('no-ops the FILM detail row when notes are omitted', async () => {
      const film = await builder.create(
        { ...base, type: ActivityType.FILM, notes: 'original' },
        team.id,
      );

      await builder.update(film.id, {
        id: film.id,
        teamId: team.id,
        title: 'New title',
        type: ActivityType.FILM,
      });

      const row = await testPrisma.film.findUnique({
        where: { activityId: film.id },
      });
      expect(row?.notes).toBe('original');
    });
  });
});
