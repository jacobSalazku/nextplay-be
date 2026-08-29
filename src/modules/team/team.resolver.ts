import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { CoachGuard } from '../auth/guards/coach-guard';
import { GqlJwtAuthGuard } from '../auth/guards/jwt-guard';
import { CurrentTeamId } from './decorator/current-team.decorator';
import {
  AcceptTeamInviteInput,
  AcceptTeamInviteResponse,
  AcceptTeamRequestInput,
  CreateTeamInput,
  CreateTeamInviteInput,
  GetTeamInput,
  JoinTeamInput,
  JoinTeamResponse,
  ModerateJoinRequestResult,
  TeamInformation,
  TeamInviteResponse,
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
  joinTeam(
    @Args('input') input: JoinTeamInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.team.requestToJoinTeam(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard, CoachGuard)
  @Mutation(() => TeamInviteResponse)
  async createTeamInvite(
    @Args('input') input: CreateTeamInviteInput,
    @CurrentUser() user: { userId: string },
  ): Promise<TeamInviteResponse> {
    return this.team.createTeamInvite(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => AcceptTeamInviteResponse)
  async acceptTeamInvite(
    @Args('input') input: AcceptTeamInviteInput,
    @CurrentUser() user: { userId: string },
  ): Promise<AcceptTeamInviteResponse> {
    return this.team.acceptTeamInvite(input, user.userId);
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
