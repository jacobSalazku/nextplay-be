import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Category } from '@prisma/client';

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

  @Field()
  canvas: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
