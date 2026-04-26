import { Field, ID, InputType } from '@nestjs/graphql';

@InputType()
export class DeleteActivity {
  @Field(() => ID)
  id: string;
}
