import { Query, Resolver } from '@nestjs/graphql';
import { Public } from './modules/auth/decorator/public.decorator';

@Resolver()
export class RootResolver {
  @Public()
  @Query(() => Boolean)
  _ping() {
    return true;
  }
}
