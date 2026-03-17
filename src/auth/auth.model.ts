import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthPayload {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;
}

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  emailVerified?: Date;

  @Field()
  isBlocked: boolean;

  @Field()
  tokenVersion: number;
}
