import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { Status } from '@prisma/client';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { TeamMemberInfo } from '../member/dto';

@ObjectType()
export class TeamInformation {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  slug: string;

  @Field()
  routeKey: string;

  @Field()
  shortId: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  ageGroup?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  creatorId: string;

  @Field(() => [TeamMemberInfo])
  members: TeamMemberInfo[];
}
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

@InputType()
export class JoinTeamInput {
  @Field()
  @IsString()
  @MinLength(1)
  teamCode: string;

  @Field()
  @IsString()
  @MinLength(1)
  position: string;

  @Field()
  @IsString()
  @MinLength(1)
  number: string;
}

@ObjectType()
export class ModerateJoinRequestResult {
  @Field()
  memberId: string;

  @Field()
  teamId: string;

  @Field(() => Status)
  status: Status;
}

@ObjectType()
export class JoinTeamResponse {
  @Field()
  teamCode: string;

  @Field()
  position: string;

  @Field()
  number: string;
}

@InputType()
export class TeamRequestInput {
  @Field()
  memberId: string;
}

@InputType()
export class AcceptTeamRequestInput extends TeamRequestInput {
  @Field()
  routeKey: string;
}

@InputType()
export class RejectJoinRequestInput {
  @Field()
  memberId: string;
}

@InputType()
export class GetTeamInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}
