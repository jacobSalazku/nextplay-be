import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
});

@InputType()
export class PlayerActivityAttendanceInput {
  activityId: string;

  @Field()
  memeberId: string;

  @Field()
  reason: string;

  @Field(() => AttendanceStatus)
  attendanceStatus: AttendanceStatus;
}
