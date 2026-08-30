import { Field, ID, ObjectType } from '@nestjs/graphql';
import { ActivityType } from '@prisma/client';
import { Activity } from '../activity/activity.model';
import { TeamMemberUser } from '../member/member.model';

@ObjectType()
class MemberId {
  @Field()
  id: string;
}

@ObjectType()
export class DashboardActivity {
  @Field(() => ID)
  id: string;

  @Field(() => ActivityType)
  type: ActivityType;

  @Field()
  title: string;

  @Field()
  date: Date;

  @Field()
  time: string;
}

@ObjectType()
export class Team {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  slug: string;

  @Field()
  shortId: string;

  @Field()
  routeKey: string;

  @Field(() => String, { nullable: true })
  ageGroup?: string | null;

  @Field(() => String, { nullable: true })
  image?: string | null;

  @Field(() => [TeamMemberUser], { nullable: true })
  members?: TeamMemberUser[];

  @Field(() => [Activity], { nullable: true })
  activities?: Activity[];

  @Field({ nullable: true })
  creatorId: string;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

@ObjectType()
export class TeamDashboard {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  slug: string;

  @Field()
  shortId: string;

  @Field()
  routeKey: string;

  @Field(() => String, { nullable: true })
  ageGroup?: string | null;

  @Field(() => [MemberId])
  members: MemberId[];

  @Field(() => [DashboardActivity])
  activities: DashboardActivity[];
}

@ObjectType()
export class JoinTeamResult {
  @Field()
  teamCode: string;

  @Field(() => String, { nullable: true })
  position?: string | null;

  @Field(() => String, { nullable: true })
  number?: string | null;
  @Field()
  createdAt: Date;
}
