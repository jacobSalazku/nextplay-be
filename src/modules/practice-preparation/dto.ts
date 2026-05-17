import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePracticePreparationInput {
  @Field()
  routeKey: string;

  @Field()
  name: string;

  @Field(() => String, { nullable: true })
  focus?: string;

  @Field(() => String, { nullable: true })
  notes?: string;

  @Field()
  activityId: string;

  @Field(() => [String])
  playsId: string[];
}

@InputType()
export class GetPracticePreparationsInput {
  @Field()
  routeKey: string;
}

@InputType()
export class GetPracticePreparationByIdInput {
  @Field()
  routeKey: string;

  @Field()
  id: string;
}

@InputType()
export class DeletePracticePreparationInput {
  @Field()
  routeKey: string;

  @Field()
  practicePreparationId: string;
}
