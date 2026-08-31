import { Field, InputType } from '@nestjs/graphql';
import { IsArray, IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateGamePlanInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  opponent?: string;

  @Field({ nullable: true })
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
export class GetGamePlansInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}

@InputType()
export class GetGamePlanByIdInput {
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
export class DeleteGamePlanInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  gamePlanId: string;
}
