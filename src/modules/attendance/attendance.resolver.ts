import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentTeam } from '../auth/decorator/current-team.decorator';
import { TeamMemberGuard } from '../auth/guards/team-access.guard';
import type { TeamAccess } from '../auth/team-access.service';
import { PlayerActivityAttendance } from './attendance.model';
import { AttendanceService } from './attendance.service';
import {
  GetAttendanceByActivitiesInput,
  PlayerActivityAttendanceInput,
} from './dto';

@Resolver(() => PlayerActivityAttendance)
export class AttendanceResolver {
  constructor(private readonly attendance: AttendanceService) {}

  @UseGuards(TeamMemberGuard)
  @Query(() => PlayerActivityAttendance, { nullable: true })
  async getAttendanceByActivities(
    @Args('input') input: GetAttendanceByActivitiesInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<PlayerActivityAttendance | null> {
    return await this.attendance.getAttendance(input, team.teamId);
  }

  @UseGuards(TeamMemberGuard)
  @Mutation(() => PlayerActivityAttendance)
  async submitAttendance(
    @Args('input') input: PlayerActivityAttendanceInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<PlayerActivityAttendance> {
    return await this.attendance.submit(input, team);
  }
}
