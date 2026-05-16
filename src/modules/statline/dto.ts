import { Field, InputType, Int } from '@nestjs/graphql';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

@InputType()
export class TeamStatlineInput {
  @Field()
  @IsString()
  @MinLength(1)
  teamRef: string;
}

@InputType()
export class StatsPerGameInput extends TeamStatlineInput {
  @Field()
  @IsString()
  @MinLength(1)
  memberId: string;

  @Field(() => Int)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}

@InputType()
export class StatlineValueInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  fieldGoalsMade?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  fieldGoalsMissed?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  threePointersMade?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  threePointersMissed?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  freeThrows?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  freeThrowsMissed?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  assists?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  steals?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  turnovers?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offensiveRebounds?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  defensiveRebounds?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  blocks?: number;
}

@InputType()
export class PlayerStatlineEntryInput {
  @Field()
  @IsString()
  @MinLength(1)
  memberId: string;

  @Field()
  @IsString()
  @MinLength(1)
  activityId: string;

  @Field(() => [StatlineValueInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StatlineValueInput)
  statlines: StatlineValueInput[];
}

@InputType()
export class OpponentStatlineInput {
  @Field()
  @IsString()
  @MinLength(1)
  activityId: string;

  @Field()
  @IsString()
  @MinLength(1)
  name: string;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  fieldGoalsMade: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  threePointersMade: number;

  @Field(() => Int)
  @IsInt()
  @Min(0)
  freeThrowsMade: number;
}

@InputType()
export class SubmitStatlinesInput extends TeamStatlineInput {
  @Field(() => [PlayerStatlineEntryInput])
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PlayerStatlineEntryInput)
  players: PlayerStatlineEntryInput[];

  @Field(() => OpponentStatlineInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => OpponentStatlineInput)
  opponentStatline?: OpponentStatlineInput;
}
