import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentTeam } from '../auth/decorator/current-team.decorator';
import {
  TeamCoachGuard,
  TeamMemberGuard,
} from '../auth/guards/team-access.guard';
import type { TeamAccess } from '../auth/team-access.service';
import {
  CreatePlayInput,
  DeletePlayInput,
  GetPlayInput,
  GetPlaysInput,
  UpdatePlayInput,
} from './dto';
import {
  FormationPresetModel,
  PlayEditorConfig,
} from './play-editor-config.model';
import { Play } from './play.model';
import { PlayService } from './play.service';

@Resolver(() => Play)
export class PlayResolver {
  constructor(private readonly play: PlayService) {}

  @Query(() => PlayEditorConfig)
  playEditorConfig(): PlayEditorConfig {
    const config = this.play.getEditorConfig();
    return {
      actionTypes: config.actionTypes,
      objectKinds: config.objectKinds,
      courts: config.courts,
      formations: config.formations as unknown as FormationPresetModel[],
    };
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [Play])
  async getPlays(
    @Args('input') _input: GetPlaysInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Play[]> {
    return this.play.getPlays(team.teamId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => Play, { nullable: true })
  async getPlay(
    @Args('input') input: GetPlayInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Play | null> {
    return this.play.getPlayById(input.id, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Play)
  async createPlay(
    @Args('input') input: CreatePlayInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Play> {
    return this.play.createPlay(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Play)
  async updatePlay(
    @Args('input') input: UpdatePlayInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<Play> {
    return this.play.updatePlay(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Boolean)
  async deletePlay(
    @Args('input') input: DeletePlayInput,
    @CurrentTeam() team: TeamAccess,
  ): Promise<boolean> {
    return await this.play.deletePlay(input.id, team.teamId);
  }
}
