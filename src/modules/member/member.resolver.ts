import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentTeam } from '../auth/decorator/current-team.decorator';
import {
  TeamCoachGuard,
  TeamMemberGuard,
} from '../auth/guards/team-access.guard';
import type { TeamAccess } from '../auth/team-access.service';
import {
  ActiveAttendedMembersInput,
  DeleteMemberInput,
  GetMemberProfileInput,
  MembersInput,
} from './dto';
import { MemberWithAttendances, MemberWithStatlines } from './member.model';
import { MemberService } from './member.service';

@Resolver(() => MemberWithAttendances)
export class MemberResolver {
  constructor(private readonly member: MemberService) {}

  @UseGuards(TeamMemberGuard)
  @Query(() => MemberWithAttendances)
  async getMemberProfile(@Args('input') input: GetMemberProfileInput) {
    return await this.member.getMemberProfile(input);
  }

  @UseGuards(TeamMemberGuard)
  @Query(() => [MemberWithAttendances])
  async getMembers(@Args('input') input: MembersInput) {
    return await this.member.getActiveMembers(input.routeKey);
  }

  @UseGuards(TeamCoachGuard)
  @Query(() => [MemberWithStatlines])
  async getActiveAttendedMembers(
    @Args('input') input: ActiveAttendedMembersInput,
  ) {
    return this.member.getActiveAttendedMembers(input);
  }

  @UseGuards(TeamCoachGuard)
  @Mutation(() => Boolean)
  async deleteMember(
    @Args('input') input: DeleteMemberInput,
    @CurrentTeam() team: TeamAccess,
  ) {
    return await this.member.deleteMember(input.id, team.teamId);
  }
}
