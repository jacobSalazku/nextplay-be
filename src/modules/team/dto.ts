import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Status } from '@prisma/client';
import { IsOptional, IsString, MinLength } from 'class-validator';

registerEnumType(Status, { name: 'Status' });
@InputType()
export class CreateTeamInput {
  @Field()
  @IsString()
  @MinLength(3, { message: 'Team name must be at least 3 characters.' })
  name: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  image?: string;

  @Field()
  @IsString()
  @MinLength(1, { message: 'Age group is required' })
  ageGroup: string;
}

@InputType()
export class JoinTeamInput {
  @Field()
  @IsString()
  @MinLength(1)
  teamCode: string;

  @Field()
  @IsString()
  @MinLength(1)
  position: string;

  @Field()
  @IsString()
  @MinLength(1)
  number: string;
}

@ObjectType()
export class ModerateJoinRequestResult {
  @Field()
  memberId: string;

  @Field()
  teamId: string;

  @Field(() => Status)
  status: Status;
}

@ObjectType()
export class JoinTeamResponse {
  @Field()
  teamCode: string;

  @Field()
  position: string;

  @Field()
  number: string;
}

@InputType()
export class ApproveJoinRequestInput {
  @Field()
  memberId: string;
}

@InputType()
export class RejectJoinRequestInput {
  @Field()
  memberId: string;
}
