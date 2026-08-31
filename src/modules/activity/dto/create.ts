import { Field, InputType } from '@nestjs/graphql';
import { ActivityType, Location, PracticeType } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateActivityInput {
  @Field()
  @IsString()
  @MinLength(1)
  title: string;

  @Field()
  @IsString()
  @MinLength(1)
  time: string;

  @Field()
  @IsNumber()
  @IsPositive()
  duration: number;

  @Field()
  @IsDate()
  date: Date;

  @Field()
  @IsString()
  @MinLength(1)
  teamId: string;
}

@InputType()
export class CreatePracticeInput extends CreateActivityInput {
  @Field()
  @IsString()
  @MinLength(1)
  facility: string;

  @Field(() => PracticeType)
  @IsEnum(PracticeType)
  practiceType: PracticeType;

  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateGameInput extends CreateActivityInput {
  @Field(() => Location)
  @IsEnum(Location)
  location: Location;

  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateFilmInput extends CreateActivityInput {
  @Field()
  @IsString()
  @MinLength(1)
  notes: string;

  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateMeetingInput extends CreateActivityInput {
  @Field()
  @IsString()
  @MinLength(1)
  notes: string;

  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  type: ActivityType;
}

@InputType()
export class CreateFeedbackInput extends CreateActivityInput {
  @Field()
  @IsString()
  @MinLength(1)
  coach: string;

  @Field()
  @IsString()
  @MinLength(1)
  notes: string;

  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  type: ActivityType;
}
