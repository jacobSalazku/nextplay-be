import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CoachGuard } from '../auth/guards/coach-guard';
import { GqlJwtAuthGuard } from '../auth/guards/jwt-guard';
import { DeleteMemberInput, MembersInput } from './dto';
import { MemberWithAttendances, PendingMember } from './member.model';
import { MemberService } from './member.service';

@Resolver(() => MemberWithAttendances)
export class MemberResolver {
  constructor(private readonly member: MemberService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Query(() => [MemberWithAttendances])
  async getMembers(@Args('input') input: MembersInput) {
    return await this.member.getActiveMembers(input.teamRef);
  }

  @UseGuards(GqlJwtAuthGuard, CoachGuard)
  @Query(() => [PendingMember])
  async getPendingMembers(@Args('input') input: MembersInput) {
    return await this.member.getPendingMembers(input.teamRef);
  }

  @UseGuards(GqlJwtAuthGuard, CoachGuard)
  @Mutation(() => Boolean)
  async deleteMember(@Args('input') input: DeleteMemberInput) {
    return await this.member.deleteMember(input.id);
  }
}
