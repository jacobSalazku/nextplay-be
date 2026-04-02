import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { ActivityType as PrismaActivityType } from '@prisma/client';

registerEnumType(PrismaActivityType, {
  name: 'ActivityType',
});

@ObjectType()
export class Activity {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  time: string;

  @Field(() => PrismaActivityType)
  type: PrismaActivityType;

  @Field({ nullable: true })
  duration?: number;

  @Field()
  date: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field()
  teamId: string;
}
