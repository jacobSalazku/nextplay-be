import { Field, ID, InputType } from '@nestjs/graphql';
import { ActivityType, Location, PracticeType } from '@prisma/client';

export class UpdateActivityBaseInput {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  time?: string;

  @Field({ nullable: true })
  date?: Date;

  @Field({ nullable: true })
  duration?: number;

  @Field(() => ActivityType)
  type: ActivityType;

  @Field()
  teamId: string;
}

@InputType()
export class UpdateGameInput extends UpdateActivityBaseInput {
  @Field(() => Location, { nullable: true })
  location?: Location;
}

@InputType()
export class UpdatePracticeInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  facility?: string;

  @Field(() => PracticeType, { nullable: true })
  practiceType?: PracticeType;
}

@InputType()
export class UpdateFilmInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class UpdateMeetingInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  notes?: string;
}

@InputType()
export class UpdateFeedbackInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  coach?: string;

  @Field({ nullable: true })
  notes?: string;
}
