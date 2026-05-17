import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Category } from '@prisma/client';

@ObjectType()
export class GamePlanActivity {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  date: Date;

  @Field()
  time: string;
}

@ObjectType()
export class GamePlanPlay {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Category)
  category: Category;
}

@ObjectType()
export class GamePlan {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  opponent?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field()
  activityId: string;

  @Field()
  teamId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => GamePlanActivity, { nullable: true })
  activity?: GamePlanActivity;

  @Field(() => [GamePlanPlay])
  plays: GamePlanPlay[];
}
