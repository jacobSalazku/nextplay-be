import { Field, InputType } from '@nestjs/graphql';
import { Category } from '@prisma/client';

@InputType()
export class GetPlaysInput {
  @Field()
  routeKey: string;
}

@InputType()
export class GetPlayInput {
  @Field()
  id: string;
}

@InputType()
export class DeletePlayInput extends GetPlayInput {
  @Field()
  routeKey: string;
}

@InputType()
export class CreatePlayInput {
  @Field()
  routeKey: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Category)
  category: Category;

  @Field()
  canvas: string;
}
