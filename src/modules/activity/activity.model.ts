import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { ActivityType, Location } from '@prisma/client';
import { PlayerActivityAttendance } from '../attendance/attendance.model';

@ObjectType()
export class OpponentStatline {
  @Field()
  name: string;

  @Field()
  fieldGoalsMade: number;

  @Field()
  threePointersMade: number;

  @Field()
  freeThrowsMade: number;

  @Field()
  activityId: string;
}

@ObjectType()
export class Game {
  @Field()
  activityId: string;

  @Field(() => Location)
  location: Location;

  @Field(() => OpponentStatline, { nullable: true })
  opponentStatline?: OpponentStatline;
}

@ObjectType()
export class Practice {
  @Field()
  activityId: string;

  @Field()
  facility: string;

  @Field()
  practicetype: string;
}

@ObjectType()
export class Film {
  @Field()
  activityId: string;

  @Field()
  notes: string;
}

@ObjectType()
export class Meeting {
  @Field()
  activityId: string;

  @Field()
  notes: string;
}

@ObjectType()
export class Feedback {
  @Field()
  activityId: string;

  @Field()
  coach: string;

  @Field()
  notes: string;
}

@ObjectType()
export class Activity {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  time: string;

  @Field(() => ActivityType)
  type: ActivityType;

  @Field(() => Float, { nullable: true })
  duration?: number | null;

  @Field(() => [PlayerActivityAttendance])
  attendees: PlayerActivityAttendance[];

  @Field()
  date: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  teamId: string;

  @Field(() => Game, { nullable: true })
  game?: Game;

  @Field(() => Practice, { nullable: true })
  practice?: Practice;

  @Field(() => Film, { nullable: true })
  film?: Film;

  @Field(() => Meeting, { nullable: true })
  meeting?: Meeting;

  @Field(() => Feedback, { nullable: true })
  feedback?: Feedback;
}
