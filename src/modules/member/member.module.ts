import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CoachGuard } from '../auth/guards/coach-guard';
import { GqlJwtAuthGuard } from '../auth/guards/jwt-guard';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [MemberResolver, MemberService, CoachGuard, GqlJwtAuthGuard],
})
export class MemberModule {}
