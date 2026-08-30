import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentTeam } from '../auth/decorator/current-team.decorator';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import {
  TeamCoachGuard,
  TeamMemberGuard,
} from '../auth/guards/team-access.guard';
import type { TeamAccess } from '../auth/team-access.service';
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

  @UseGuards(TeamMemberGuard)
  @Query(() => [Activity])
  async getActivities(
    @Args('teamShortId') teamShortId: string,
  ): Promise<Activity[]> {
    return await this.activity.getActivities(teamShortId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => Activity)
  async getActivity(
    @Args('input') input: GetActivityInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Activity> {
    return await this.activity.getActivity(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [Activity])
  async getGames(
    @Args('input') input: GetActivitiesInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Activity[]> {
    return await this.activity.getGames(input, user.userId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [Activity])
  async getPractices(
    @Args('input') input: GetActivitiesInput,
    @CurrentUser() user: { userId: string },
  ): Promise<Activity[]> {
    return await this.activity.getPractices(input, user.userId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async deleteActivity(
    @Args('input') input: DeleteActivity,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.deleteActivity(input.id, team.teamId);
  }

  //GAME
  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async createGame(
    @Args('input') input: CreateGameInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.createActivity(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async updateGame(
    @Args('input') input: UpdateGameInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.updateActivity(input, team.teamId);
  }

  //PRACTICE
  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async createPractice(
    @Args('input') input: CreatePracticeInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.createActivity(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async updatePractice(
    @Args('input') input: UpdatePracticeInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.updateActivity(input, team.teamId);
  }

  //MEETING
  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async createMeeting(
    @Args('input') input: CreateMeetingInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return this.activity.createActivity(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async updateMeeting(
    @Args('input') input: UpdateMeetingInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.updateActivity(input, team.teamId);
  }

  //FILM
  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async createFilm(
    @Args('input') input: CreateFilmInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return this.activity.createActivity(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async updateFilm(
    @Args('input') input: UpdateFilmInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.updateActivity(input, team.teamId);
  }

  //FEEDBACK
  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async createFeedback(
    @Args('input') input: CreateFeedbackInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return this.activity.createActivity(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Activity)
  async updateFeedback(
    @Args('input') input: UpdateFeedbackInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Activity> {
    return await this.activity.updateActivity(input, team.teamId);
  }
}
