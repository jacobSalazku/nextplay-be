import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Role, Status } from '@prisma/client';

registerEnumType(Role, {
  name: 'Role',
});

registerEnumType(Status, {
  name: 'Status',
});

@ObjectType()
export class UserDetail {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;
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
}
