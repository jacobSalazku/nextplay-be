import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Activity } from '../activity/activity.model';
import { Member } from '../member/member.model';

@ObjectType()
export class Team {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  code: string;

  @Field({ nullable: true })
  ageGroup?: string;

  @Field({ nullable: true })
  image?: string;

  @Field()
  creatorId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class TeamDashboard {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  ageGroup?: string;

  @Field(() => [Member])
  members: Member[];

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

  createdAt;
}
