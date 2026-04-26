import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GqlJwtAuthGuard } from '../auth/jwt-guard';
import { ActivityBuilder } from './activity.builder';
import { ActivityResolver } from './activity.resolver';
import { ActivityService } from './activity.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    ActivityService,
    ActivityResolver,
    ActivityBuilder,
    GqlJwtAuthGuard,
  ],
})
export class ActivityModule {}
