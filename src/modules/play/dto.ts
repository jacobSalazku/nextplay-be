import { Field, InputType } from '@nestjs/graphql';
import { Category } from '@prisma/client';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { GraphQLJSON } from 'graphql-scalars';

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

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  canvas?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  diagram?: unknown;
}

@InputType()
export class UpdatePlayInput {
  @Field()
  @IsString()
  @MinLength(1)
  id: string;

  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @Field(() => Category, { nullable: true })
  @IsOptional()
  category?: Category;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  diagram?: unknown;
}
