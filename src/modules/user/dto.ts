import { Field, Float, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, MinLength } from 'class-validator';
import { User } from '../auth/auth.model';
import { Member } from '../member/member.model';

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
@ObjectType()
export class GetUserResponse {
  @Field(() => User)
  user: User;

  @Field(() => Member)
  member: Member;
}
