import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreatePracticePreparationInput {
  @Field()
  teamRef: string;

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
  teamRef: string;
}

@InputType()
export class GetPracticePreparationByIdInput {
  @Field()
  teamRef: string;

  @Field()
  id: string;
}

@InputType()
export class DeletePracticePreparationInput {
  @Field()
  teamRef: string;

  @Field()
  practicePreparationId: string;
}
