import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class RootResolver {
  @Query(() => Boolean)
  _ping() {
    return true;
  }
}
