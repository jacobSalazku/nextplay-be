import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GqlJwtAuthGuard } from '../auth/jwt-guard';
import { PlayerActivityAttendance } from './attendance.model';
import { AttendanceService } from './attendance.service';
import {
  GetAttendanceByActivitiesInput,
  PlayerActivityAttendanceInput,
} from './dto';

@Resolver(() => PlayerActivityAttendance)
export class AttendanceResolver {
  constructor(private readonly attendance: AttendanceService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => PlayerActivityAttendance)
  async getAttendanceByActivities(
    @Args('input') input: GetAttendanceByActivitiesInput,
  ) {
    return await this.attendance.getAttendance(input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => PlayerActivityAttendance)
  async submitAttendance(@Args('input') input: PlayerActivityAttendanceInput) {
    return await this.attendance.submit(input);
  }
}
