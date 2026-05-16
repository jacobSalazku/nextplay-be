import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { CoachGuard } from '../auth/guards/coach-guard';
import { GqlJwtAuthGuard } from '../auth/guards/jwt-guard';
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

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [PlayerStatlineAverage])
  async getStatlineAverages(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.statline.getStatlineAverages(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [WeeklyTeamAverage])
  async getWeeklyTeamAverages(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.statline.getWeeklyTeamAverages(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => TeamStats)
  async getTeamStats(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.statline.getTeamStats(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [StatsPerGame])
  async getStatsPerGame(
    @Args('input') input: StatsPerGameInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.statline.getStatsPerGame(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [GameWithBoxScore])
  async getGamesWithBoxScores(
    @Args('input') input: TeamStatlineInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.statline.getGamesWithBoxScores(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard, CoachGuard)
  @Mutation(() => SubmitStatlinesResult)
  async submitStatlines(
    @Args('input') input: SubmitStatlinesInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.statline.submitStatlines(input, user.userId);
  }
}
