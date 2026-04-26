import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';

registerEnumType(AttendanceStatus, {
  name: 'AttendanceStatus',
});

@ObjectType()
export class PlayerActivityAttendance {
  @Field(() => ID)
  id: string;

  @Field()
  memberId: string;

  @Field({ nullable: true })
  reason: string;

  @Field(() => AttendanceStatus)
  attendanceStatus: AttendanceStatus;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}
