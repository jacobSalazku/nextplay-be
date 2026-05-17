import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CoachGuard } from '../auth/guards/coach-guard';
import { GqlJwtAuthGuard } from '../auth/guards/jwt-guard';
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

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [Play])
  async getPlays(@Args('input') input: GetPlaysInput) {
    return this.play.getPlays(input.routeKey);
  }

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => Play, { nullable: true })
  async getPlay(@Args('input') input: GetPlayInput) {
    return this.play.getPlayById(input.id);
  }

  @UseGuards(GqlJwtAuthGuard, CoachGuard)
  @Mutation(() => Play)
  async createPlay(@Args('input') input: CreatePlayInput) {
    return this.play.createPlay(input);
  }

  @UseGuards(GqlJwtAuthGuard, CoachGuard)
  @Mutation(() => Boolean)
  async deletePlay(@Args('input') input: DeletePlayInput) {
    return await this.play.deletePlay(input);
  }
}
