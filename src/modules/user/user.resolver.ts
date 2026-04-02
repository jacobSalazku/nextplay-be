import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { User } from '../auth/auth.model';
import { CurrentUser } from '../auth/decorator/current-user.decorator';
import { GqlJwtAuthGuard } from '../auth/jwt-guard';
import { UpdateUserInput } from './dto';
import { UserService } from './user.service';

@Resolver()
export class UserResolver {
  constructor(private readonly user: UserService) {}

  @UseGuards(GqlJwtAuthGuard)
  @Mutation(() => User, { name: 'updateUser' })
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: { userId: string },
  ) {
    return this.user.updateUser(input, user.userId);
  }
}
