import { Field, ID, InputType, ObjectType } from '@nestjs/graphql';
import { UserDetail } from './member.model';

@InputType()
export class MembersInput {
  @Field()
  teamRef: string;
}

@InputType()
export class DeleteMemberInput {
  @Field()
  id: string;
}

@ObjectType()
export class TeamMemberInfo {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  image?: string;

  @Field({ nullable: true })
  number: string;

  @Field({ nullable: true })
  position: string;

  @Field()
  teamId: string;

  @Field(() => UserDetail)
  user: UserDetail;
}
