import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';
import { UserDetail } from './member.model';

@InputType()
export class MembersInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}

@InputType()
export class DeleteMemberInput {
  @Field()
  @IsString()
  @MinLength(1)
  id: string;

  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}

@InputType()
export class ActiveAttendedMembersInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  activityId: string;
}

@ObjectType()
export class TeamMemberInfo {
  @Field(() => ID)
  id: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  image?: string | null;

  @Field(() => String, { nullable: true })
  number?: string | null;

  @Field(() => String, { nullable: true })
  position?: string | null;

  @Field()
  teamId: string;

  @Field(() => UserDetail)
  user: UserDetail;
}

@InputType()
export class GetMemberProfileInput {
  @Field()
  @IsString()
  @MinLength(1)
  id: string;

  @Field()
  @IsString()
  @MinLength(1)
  teamShortId: string;
}
