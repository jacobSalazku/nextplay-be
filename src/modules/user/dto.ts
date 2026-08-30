import { Field, Float, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, MinLength } from 'class-validator';
import { MemberWithAttendances } from '../member/member.model';

@ObjectType()
export class UserProfile {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field({ nullable: true })
  email: string;

  @Field(() => Date, { nullable: true })
  dateOfBirth?: Date | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;

  @Field(() => Float, { nullable: true })
  height?: number | null;

  @Field(() => Float, { nullable: true })
  weight?: number | null;

  @Field(() => String, { nullable: true })
  dominantHand?: string | null;

  @Field({ nullable: true })
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

  @Field(() => MemberWithAttendances)
  member: MemberWithAttendances;
}
