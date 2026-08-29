import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import {
  TeamCoachGuard,
  TeamMemberGuard,
} from '../auth/guards/team-access.guard';
import {
  CreatePracticePreparationInput,
  DeletePracticePreparationInput,
  GetPracticePreparationByIdInput,
  GetPracticePreparationsInput,
} from './dto';
import { PracticePreparation } from './practice-preparation.model';
import { PracticePreparationService } from './practice-preparation.service';

@Resolver(() => PracticePreparation)
export class PracticePreparationResolver {
  constructor(private readonly preparation: PracticePreparationService) {}

  @UseGuards(TeamCoachGuard)
  @Mutation(() => PracticePreparation)
  async createPracticePreparation(
    @Args('input') input: CreatePracticePreparationInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.preparation.createPracticePreparation(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [PracticePreparation])
  async getPracticePreparations(
    @Args('input') input: GetPracticePreparationsInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.preparation.getPracticePreparations(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => PracticePreparation, { nullable: true })
  async getPracticePreparationById(
    @Args('input') input: GetPracticePreparationByIdInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.preparation.getPracticePreparationById(input, user.userId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => PracticePreparation)
  async deletePracticePreparation(
    @Args('input') input: DeletePracticePreparationInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.preparation.deletePracticePreparation(input, user.userId);
  }
}
