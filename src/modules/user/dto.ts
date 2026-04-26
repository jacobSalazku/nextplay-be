import { Field, Float, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, MinLength } from 'class-validator';
import { Member } from '../member/member.model';

@ObjectType()
export class UserProfile {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => Float, { nullable: true })
  height?: number;

  @Field(() => Float, { nullable: true })
  weight?: number;

  @Field({ nullable: true })
  dominantHand?: string;

  @Field()
  hasOnBoarded: boolean;
}
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
  @Field(() => UserProfile)
  user: UserProfile;

  @Field(() => Member)
  member: Member;
}
