import { Field, InputType } from '@nestjs/graphql';
import { Category } from '@prisma/client';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class GetPlaysInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}

@InputType()
export class GetPlayInput {
  @Field()
  @IsString()
  @MinLength(1)
  id: string;

  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}

@InputType()
export class DeletePlayInput {
  @Field()
  @IsString()
  @MinLength(1)
  id: string;

  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;
}

@InputType()
export class CreatePlayInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  name: string;

  @Field()
  @IsString()
  description: string;

  @Field(() => Category)
  category: Category;

  @Field()
  @IsString()
  canvas: string;
}
