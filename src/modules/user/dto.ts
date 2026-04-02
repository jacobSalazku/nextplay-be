import { Field, Float, InputType } from '@nestjs/graphql';
import { IsNumber, IsString, MinLength } from 'class-validator';

@InputType()
export class UpdateUserInput {
  @Field()
  @IsString()
  @MinLength(1)
  name: string;

  @Field()
  @IsString()
  @MinLength(1)
  dateOfBirth: string;

  @Field()
  @IsString()
  @MinLength(1)
  phone: string;

  @Field(() => Float)
  @IsNumber()
  height: number;

  @Field(() => Float)
  @IsNumber()
  weight: number;

  @Field()
  @IsString()
  @MinLength(1)
  dominantHand: string;
}
