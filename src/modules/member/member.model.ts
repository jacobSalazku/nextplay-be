import { Field, Float, ID, ObjectType } from '@nestjs/graphql';
import { Role, Status } from '@prisma/client';
import { PlayerActivityAttendance } from '../attendance/attendance.model';

@ObjectType()
export class UserDetail {
  @Field()
  id: string;

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field({ nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  image?: string | null;

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

  @Field(() => String, { nullable: true })
  name?: string | null;

  @Field(() => String, { nullable: true })
  image?: string | null;
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

  @Field(() => String, { nullable: true })
  number?: string | null;

  @Field(() => String, { nullable: true })
  position?: string | null;

  @Field(() => String, { nullable: true })
  name?: string | null;

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
