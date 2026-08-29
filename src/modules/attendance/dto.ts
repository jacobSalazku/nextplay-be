import { Field, InputType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class PlayerActivityAttendanceInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  activityId: string;

  @Field()
  @IsString()
  @MinLength(1)
  memberId: string;

  @Field()
  @IsString()
  reason: string;

  @Field(() => AttendanceStatus)
  attendanceStatus: AttendanceStatus;
}

@InputType()
export class GetAttendanceByActivitiesInput {
  @Field()
  @IsString()
  @MinLength(1)
  routeKey: string;

  @Field()
  @IsString()
  @MinLength(1)
  activityId: string;

  @Field()
  @IsString()
  @MinLength(1)
  memberId: string;
}
