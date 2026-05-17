import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { GqlJwtAuthGuard } from '../auth/guards/jwt-guard';
import { Activity } from './activity.model';
import { ActivityService } from './activity.service';
import {
  CreateFeedbackInput,
  CreateFilmInput,
  CreateGameInput,
  CreateMeetingInput,
  CreatePracticeInput,
} from './dto/create';
import { DeleteActivity } from './dto/delete';
import { GetActivitiesInput, GetActivityInput } from './dto/get';
import {
  UpdateFeedbackInput,
  UpdateFilmInput,
  UpdateGameInput,
  UpdateMeetingInput,
  UpdatePracticeInput,
} from './dto/update';

@Resolver(() => Activity)
export class ActivityResolver {
  constructor(private readonly activity: ActivityService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Activity])
  async getActivities(@Args('teamShortId') teamShortId: string) {
    return await this.activity.getActivities(teamShortId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Activity)
  async getActivity(
    @Args('input') input: GetActivityInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Activity> {
    return await this.activity.getActivity(input, user.userId);
  }
  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Activity])
  async getGames(
    @Args('input') input: GetActivitiesInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Activity[]> {
    return await this.activity.getGames(input, user.userId);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Activity])
  async getPractices(
    @Args('input') input: GetActivitiesInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Activity[]> {
    return await this.activity.getPractices(input, user.userId);
  }

  @Mutation(() => Activity)
  async deleteActivity(@Args('input') input: DeleteActivity) {
    return await this.activity.deleteActivity(input.id);
  }

  //GAME
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async createGame(@Args('input') input: CreateGameInput) {
    return await this.activity.createActivity(input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async updateGame(@Args('input') input: UpdateGameInput) {
    return await this.activity.updateActivity(input);
  }

  //PRACTICE
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async createPractice(@Args('input') input: CreatePracticeInput) {
    return await this.activity.createActivity(input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async updatePractice(@Args('input') input: UpdatePracticeInput) {
    return await this.activity.updateActivity(input);
  }

  //MEETING
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async createMeeting(@Args('input') input: CreateMeetingInput) {
    return this.activity.createActivity(input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async updateMeeting(@Args('input') input: UpdateMeetingInput) {
    return await this.activity.updateActivity(input);
  }

  //FILM
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async createFilm(@Args('input') input: CreateFilmInput) {
    return this.activity.createActivity(input);
  }
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async updateFilm(@Args('input') input: UpdateFilmInput) {
    return await this.activity.updateActivity(input);
  }

  //FEEDBACK
  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async createFeedback(@Args('input') input: CreateFeedbackInput) {
    return this.activity.createActivity(input);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => Activity)
  async updateFeedback(@Args('input') input: UpdateFeedbackInput) {
    return await this.activity.updateActivity(input);
  }
}
