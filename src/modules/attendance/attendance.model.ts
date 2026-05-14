import { Field, ID, ObjectType } from '@nestjs/graphql';
import { AttendanceStatus } from '@prisma/client';

@ObjectType()
export class AttendanceActivity {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  time: string;

  @Field()
  date: Date;
}

@ObjectType()
export class PlayerActivityAttendance {
  @Field(() => ID)
  id: string;

  @Field()
  activityId: string;

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

  @Field(() => AttendanceActivity, { nullable: true })
  activity?: AttendanceActivity;
}
