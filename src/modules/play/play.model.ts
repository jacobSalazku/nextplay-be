import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Category } from '@prisma/client';
import { GraphQLJSON } from 'graphql-scalars';

@ObjectType()
export class Play {
  @Field(() => ID)
  id: string;

  @Field()
  routeKey: string;

  @Field()
  name: string;

  @Field(() => Category)
  category: Category;

  @Field()
  description: string;

  @Field(() => String, { nullable: true })
  canvas?: string | null;

  @Field(() => GraphQLJSON, { nullable: true })
  diagram?: unknown;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
