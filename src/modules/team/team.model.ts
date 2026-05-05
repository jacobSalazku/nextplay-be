import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Activity } from '../activity/activity.model';
import { TeamMemberUser } from '../member/member.model';

@ObjectType()
class MemberId {
  @Field()
  id: string;
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

  @Field({ nullable: true })
  ageGroup?: string;

  @Field({ nullable: true })
  image?: string;

  @Field(() => [TeamMemberUser])
  members: TeamMemberUser[];

  @Field(() => [Activity])
  activities: Activity[];

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

  @Field({ nullable: true })
  ageGroup?: string;

  @Field(() => [MemberId])
  members: MemberId;

  @Field(() => [Activity])
  activities: Activity[];
}

@ObjectType()
export class JoinTeamResult {
  @Field()
  teamCode: string;

  @Field({ nullable: true })
  position?: string;

  @Field({ nullable: true })
  number?: string;
  @Field()
  createdAt: Date;
}
