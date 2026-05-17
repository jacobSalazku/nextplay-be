import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateGamePlanInput {
  @Field()
  routeKey: string;

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
  routeKey: string;
}

@InputType()
export class GetGamePlanByIdInput {
  @Field()
  routeKey: string;

  @Field()
  id: string;
}

@InputType()
export class DeleteGamePlanInput {
  @Field()
  routeKey: string;

  @Field()
  gamePlanId: string;
}
