import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class CreatePracticePreparationInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  focus?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Field()
  @IsString()
  @MinLength(1)
  activityId: string;

  @Field(() => [String])
  @IsArray()
  @IsString({ each: true })
  playsId: string[];
}

@InputType()
export class GetPracticePreparationsInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}

@InputType()
export class GetPracticePreparationByIdInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  id: string;
}

@InputType()
export class DeletePracticePreparationInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  practicePreparationId: string;
}
