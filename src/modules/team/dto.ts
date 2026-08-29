import {
  Field,
  ID,
  InputType,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { TeamMemberInfo } from '../member/dto';

export enum AcceptTeamInviteStatus {
  SUCCESS = 'SUCCESS',
  ALREADY_JOINED = 'ALREADY_JOINED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
  USED = 'USED',
}

registerEnumType(AcceptTeamInviteStatus, {
  name: 'AcceptTeamInviteStatus',
});

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
export class CreateTeamInviteInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  expiresAt?: Date;
}

@ObjectType()
export class TeamInviteResponse {
  @Field(() => ID)
  id: string;

  @Field()
  token: string;

  @Field()
  inviteLink: string;

  @Field(() => ID)
  teamId: string;

  @Field(() => Date)
  expiresAt: Date;

  @Field(() => Int)
  maxUses: number;

  @Field(() => Int)
  usedCount: number;

  @Field(() => Date, { nullable: true })
  revokedAt?: Date | null;

  @Field(() => ID)
  createdBy: string;
}

@InputType()
export class AcceptTeamInviteInput {
  @Field()
  @IsString()
  @MinLength(1)
  token: string;
}

@ObjectType()
export class AcceptTeamInviteResponse {
  @Field(() => AcceptTeamInviteStatus)
  status: AcceptTeamInviteStatus;

  @Field(() => ID, { nullable: true })
  teamId?: string;

  @Field(() => String, { nullable: true })
  routeKey?: string | null;

  @Field(() => ID, { nullable: true })
  memberId?: string;
}

@InputType()
export class GetTeamInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}
