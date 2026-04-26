import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { GqlJwtAuthGuard } from '../auth/jwt-guard';
import {
  ApproveJoinRequestInput,
  CreateTeamInput,
  JoinTeamInput,
  JoinTeamResponse,
  ModerateJoinRequestResult,
} from './dto';
import { Team, TeamDashboard } from './team.model';
import { TeamService } from './team.service';

@Resolver(() => Team)
export class TeamResolver {
  constructor(private readonly team: TeamService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Team)
  async createTeam(
    @Args('input') input: CreateTeamInput,
    @CurrentUser() user: { userId: string },
  ) {
    return await this.team.createTeam(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TeamDashboard])
  async getDashboardTeams(@CurrentUser() user: { userId: string }) {
    return this.team.getTeamsForDashboard(user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Team)
  async getTeamActivities(@Args('teamRef') teamRef: string) {
    return this.team.getTeam(teamRef);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => JoinTeamResponse)
  async joinTeam(
    @Args('input') input: JoinTeamInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.team.requestToJoinTeam(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ModerateJoinRequestResult)
  approveJoinRequest(
    @Args('input') input: ApproveJoinRequestInput,
    @CurrentUser() user: { userId: string },
  ): Promise<ModerateJoinRequestResult> {
    return this.team.approveJoinRequest(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ModerateJoinRequestResult)
  rejectJoinRequest(
    @Args('input') input: ApproveJoinRequestInput,
    @CurrentUser() user: { userId: string },
  ): Promise<ModerateJoinRequestResult> {
    return this.team.rejectJoinRequest(input, user.userId);
  }
}
