import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
});

@InputType()
export class PlayerActivityAttendanceInput {
  @Field()
  activityId: string;

  @Field()
  memeberId: string;

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
  memeberId: string;
}
