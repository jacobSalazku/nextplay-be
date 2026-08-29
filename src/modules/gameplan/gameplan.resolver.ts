import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import {
  TeamCoachGuard,
  TeamMemberGuard,
} from '../auth/guards/team-access.guard';
import {
  CreateGamePlanInput,
  DeleteGamePlanInput,
  GetGamePlanByIdInput,
  GetGamePlansInput,
} from './dto';
import { GamePlan } from './gameplan.model';
import { GameplanService } from './gameplan.service';

@Resolver(() => GamePlan)
export class GameplanResolver {
  constructor(private readonly gameplan: GameplanService) {}

  @UseGuards(TeamCoachGuard)
  @Mutation(() => GamePlan)
  async createGamePlan(
    @Args('input') input: CreateGamePlanInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.gameplan.createGamePlan(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [GamePlan])
  async getGameplan(
    @Args('input') input: GetGamePlansInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.gameplan.getGameplan(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => GamePlan, { nullable: true })
  async getGameplanById(
    @Args('input') input: GetGamePlanByIdInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.gameplan.getGameplanById(input, user.userId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => GamePlan)
  async deleteGamePlan(
    @Args('input') input: DeleteGamePlanInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.gameplan.deleteGamePlan(input, user.userId);
  }
}
