import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { CoachGuard } from '../auth/guards/coach-guard';
import { GqlJwtAuthGuard } from '../auth/guards/jwt-guard';
import { CurrentTeamId } from './decorator/current-team.decorator';
import {
  AcceptTeamRequestInput,
  CreateTeamInput,
  GetTeamInput,
  JoinTeamInput,
  JoinTeamResponse,
  ModerateJoinRequestResult,
  TeamInformation,
  TeamRequestInput,
} from './dto';
import { Team, TeamDashboard } from './team.model';
import { TeamService } from './team.service';

@Resolver(() => Team)
export class TeamResolver {
  constructor(private readonly team: TeamService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TeamInformation)
  async getTeam(@Args('input') input: GetTeamInput) {
    return this.team.getTeam(input.routeKey);
  }

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
  async getTeamActivities(@Args('routeKey') routeKey: string) {
    return this.team.getTeamActivities(routeKey);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => JoinTeamResponse)
  async joinTeam(
    @Args('input') input: JoinTeamInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.team.requestToJoinTeam(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard, CoachGuard)
  @Mutation(() => ModerateJoinRequestResult)
  acceptTeamRequest(
    @Args('input') input: AcceptTeamRequestInput,
    @CurrentTeamId() taemId: string,
  ): Promise<ModerateJoinRequestResult> {
    return this.team.acceptTeamRequest(input, taemId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => ModerateJoinRequestResult)
  rejectJoinRequest(
    @Args('input') input: TeamRequestInput,
    @CurrentUser() user: { userId: string },
  ): Promise<ModerateJoinRequestResult> {
    return this.team.rejectJoinRequest(input, user.userId);
  }
}
