import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { GqlJwtAuthGuard } from '../auth/jwt-guard';
import { CreateTeamInput } from './dto';
import { Team, TeamDashboard } from './team.model';
import { TeamService } from './team.service';

@Resolver(() => Team)
export class TeamResolver {
  constructor(private readonly teamService: TeamService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Team)
  async createTeam(
    @Args('input') input: CreateTeamInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.teamService.createTeam(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [TeamDashboard])
  async getDashboardTeams(@CurrentUser() user: { userId: string }) {
    return this.teamService.getTeamsForDashboard(user.userId);
  }
}
