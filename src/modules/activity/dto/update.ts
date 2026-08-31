import { Field, ID, InputType } from '@nestjs/graphql';
import { ActivityType, Location, PracticeType } from '@prisma/client';
import {
  IsDate,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

@InputType()
export class UpdateActivityBaseInput {
  @Field(() => ID)
  @IsString()
  @MinLength(1)
  id: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  time?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDate()
  date?: Date;

  @Field({ nullable: true })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  duration?: number;

  @Field(() => ActivityType)
  @IsEnum(ActivityType)
  type: ActivityType;

  @Field()
  @IsString()
  @MinLength(1)
  teamId: string;
}

@InputType()
export class UpdateGameInput extends UpdateActivityBaseInput {
  @Field(() => Location, { nullable: true })
  @IsOptional()
  @IsEnum(Location)
  location?: Location;
}

@InputType()
export class UpdatePracticeInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  facility?: string;

  @Field(() => PracticeType, { nullable: true })
  @IsOptional()
  @IsEnum(PracticeType)
  practiceType?: PracticeType;
}

@InputType()
export class UpdateFilmInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;
}

@InputType()
export class UpdateMeetingInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;
}

@InputType()
export class UpdateFeedbackInput extends UpdateActivityBaseInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  coach?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  notes?: string;
}
