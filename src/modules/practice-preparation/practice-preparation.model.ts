import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Category } from '@prisma/client';

@ObjectType()
export class PracticePreparationActivity {
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
export class PracticePreparationPlay {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => Category)
  category: Category;
}

@ObjectType()
export class PracticePreparation {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  focus?: string | null;

  @Field(() => String, { nullable: true })
  notes?: string | null;

  @Field(() => String, { nullable: true })
  activityId?: string | null;

  @Field()
  teamId: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => PracticePreparationActivity, { nullable: true })
  activity?: PracticePreparationActivity;

  @Field(() => [PracticePreparationPlay])
  plays: PracticePreparationPlay[];
}
