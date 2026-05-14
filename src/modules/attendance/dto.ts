import { Field, InputType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';

@InputType()
export class PlayerActivityAttendanceInput {
  @Field()
  activityId: string;

  @Field()
  memberId: string;

  @Field()
  reason: string;

  @Field(() => AttendanceStatus)
  attendanceStatus: AttendanceStatus;
}

@InputType()
export class GetAttendanceByActivitiesInput {
  @Field()
  activityId: string;

  @Field()
  memberId: string;
}
