import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import {
  TeamCoachGuard,
  TeamMemberGuard,
} from '../auth/guards/team-access.guard';
import {
  StatsPerGameInput,
  SubmitStatlinesInput,
  TeamStatlineInput,
} from './dto';
import {
  GameWithBoxScore,
  PlayerStatlineAverage,
  StatsPerGame,
  SubmitStatlinesResult,
  TeamStats,
  WeeklyTeamAverage,
} from './statline.model';
import { StatlineService } from './statline.service';

@Resolver()
export class StatlineResolver {
  constructor(private readonly statline: StatlineService) {}

  @UseGuards(TeamMemberGuard)
  @Query(() => [PlayerStatlineAverage])
  async getStatlineAverages(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ): Promise<PlayerStatlineAverage[]> {
    return this.statline.getStatlineAverages(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [WeeklyTeamAverage])
  async getWeeklyTeamAverages(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ): Promise<WeeklyTeamAverage[]> {
    return this.statline.getWeeklyTeamAverages(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => TeamStats)
  async getTeamStats(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ): Promise<TeamStats> {
    return this.statline.getTeamStats(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [StatsPerGame])
  async getStatsPerGame(
    @Args('input') input: StatsPerGameInput,
    @CurrentUser() user: { userId: string },
  ): Promise<StatsPerGame[]> {
    return this.statline.getStatsPerGame(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [GameWithBoxScore])
  async getGamesWithBoxScores(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ): Promise<GameWithBoxScore[]> {
    return this.statline.getGamesWithBoxScores(input, user.userId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => SubmitStatlinesResult)
  async submitStatlines(
    @Args('input') input: SubmitStatlinesInput,
    @CurrentUser() user: { userId: string },
  ): Promise<SubmitStatlinesResult> {
    return this.statline.submitStatlines(input, user.userId);
  }
}
