import { Field, InputType } from '@nestjs/graphql';
import { IsOptional, IsString, MinLength } from 'class-validator';

@InputType()
export class CreateTeamInput {
  @Field()
  @IsString()
  @MinLength(3, { message: 'Team name must be at least 3 characters.' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  image?: string;

  @Field()
  @IsString()
  @MinLength(1, { message: 'Age group is required' })
  ageGroup: string;
}
