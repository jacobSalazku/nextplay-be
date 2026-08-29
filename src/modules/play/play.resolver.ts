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
} from './dto';
import { Play } from './play.model';
import { PlayService } from './play.service';

@Resolver(() => Play)
export class PlayResolver {
  constructor(private readonly play: PlayService) {}

  @UseGuards(TeamMemberGuard)
  @Query(() => [Play])
  async getPlays(
    @Args('input') _input: GetPlaysInput,
    @CurrentTeam() team: TeamAccess,
  ) {
    return this.play.getPlays(team.teamId);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => Play, { nullable: true })
  async getPlay(
    @Args('input') input: GetPlayInput,
    @CurrentTeam() team: TeamAccess,
  ) {
    return this.play.getPlayById(input.id, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Play)
  async createPlay(
    @Args('input') input: CreatePlayInput,
    @CurrentTeam() team: TeamAccess,
  ) {
    return this.play.createPlay(input, team.teamId);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Boolean)
  async deletePlay(
    @Args('input') input: DeletePlayInput,
    @CurrentTeam() team: TeamAccess,
  ) {
    return await this.play.deletePlay(input.id, team.teamId);
  }
}
