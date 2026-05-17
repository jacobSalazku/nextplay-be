import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateGamePlanInput {
  @Field()
  teamRef: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  opponent?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  activityId: string;

  @Field(() => [String])
  playsId: string[];
}

@InputType()
export class GetGamePlansInput {
  @Field()
  teamRef: string;
}

@InputType()
export class GetGamePlanByIdInput {
  @Field()
  teamRef: string;

  @Field()
  id: string;
}

@InputType()
export class DeleteGamePlanInput {
  @Field()
  teamRef: string;

  @Field()
  gamePlanId: string;
}
