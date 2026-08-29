import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Role, Status } from '@prisma/client';
import { PlayerActivityAttendance } from '../attendance/attendance.model';

@ObjectType()
export class UserDetail {
  @Field()
  id: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  height?: number;

  @Field({ nullable: true })
  weight?: number;

  @Field({ nullable: true })
  dominantHand?: string;

  @Field()
  hasOnBoarded: boolean;
}

@ObjectType()
export class TeamMemberUser {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  teamId: string;

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  image?: string;
}

@ObjectType()
export class Member {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  teamId: string;

  @Field(() => Role)
  role: Role;

  @Field(() => Status)
  status: Status;

  @Field({ nullable: true })
  number?: string;

  @Field({ nullable: true })
  position?: string;

  @Field({ nullable: true })
  name?: string;

  @Field(() => UserDetail, { nullable: true })
  user?: UserDetail;
}

@ObjectType()
export class MemberWithAttendances extends Member {
  @Field(() => [PlayerActivityAttendance])
  attendances: PlayerActivityAttendance[];
}

@ObjectType()
export class MemberStatline {
  @Field(() => ID)
  id: string;

  @Field()
  activityId: string;

  @Field()
  fieldGoalsMade: number;

  @Field()
  fieldGoalsMissed: number;

  @Field()
  threePointersMade: number;

  @Field()
  threePointersMissed: number;

  @Field()
  freeThrows: number;

  @Field()
  missedFreeThrows: number;

  @Field()
  assists: number;

  @Field()
  steals: number;

  @Field()
  turnovers: number;

  @Field()
  offensiveRebounds: number;

  @Field()
  defensiveRebounds: number;

  @Field()
  blocks: number;
}

@ObjectType()
export class MemberWithStatlines extends Member {
  @Field(() => [MemberStatline])
  statlines: MemberStatline[];
}

