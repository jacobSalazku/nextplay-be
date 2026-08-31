import { Field, InputType } from '@nestjs/graphql';
import { ActivityType, Location, PracticeType } from '@prisma/client';

@InputType()
export class CreateActivityInput {
  @Field()
  title: string;

  @Field()
  time: string;

  @Field()
  duration: number;

  @Field()
  date: Date;

  @Field()
  teamId: string;
}

@InputType()
export class CreatePracticeInput extends CreateActivityInput {
  @Field()
  facility: string;

  @Field(() => PracticeType)
  practiceType: PracticeType;

  @Field(() => ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateGameInput extends CreateActivityInput {
  @Field(() => Location)
  location: Location;

  @Field(() => ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateFilmInput extends CreateActivityInput {
  @Field()
  notes: string;

  @Field(() => ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateMeetingInput extends CreateActivityInput {
  @Field()
  notes: string;

  @Field(() => ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateFeedbackInput extends CreateActivityInput {
  @Field()
  coach: string;

  @Field()
  notes: string;

  @Field(() => ActivityType)
  type: ActivityType;
}
