import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class GetActivityInput {
  @Field()
  @IsString()
  @MinLength(1)
  teamRef: string;

  @Field()
  @IsString()
  @MinLength(1)
  activityId: string;
}
