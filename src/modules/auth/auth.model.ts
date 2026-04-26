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

  @Field({ nullable: true })
  name?: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  emailVerified?: Date;

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
  isBlocked: boolean;

  @Field()
  tokenVersion: number;

  @Field()
  hasOnBoarded: boolean;

  @Field(() => [Member])
  members: Member[];
}
