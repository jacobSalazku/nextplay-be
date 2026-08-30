import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Member } from '../member/member.model';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field({ defaultValue: false })
  hasOnBoarded: boolean;

  @Field()
  userId: string;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field()
  email: string;

  @Field(() => Date, { nullable: true })
  emailVerified?: Date | null;

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

  @Field()
  isBlocked: boolean;

  @Field()
  tokenVersion: number;

  @Field()
  hasOnBoarded: boolean;

  @Field(() => [Member], { nullable: true })
  members?: Member[];
}
