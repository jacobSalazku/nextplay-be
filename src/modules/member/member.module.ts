import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { MemberResolver } from './member.resolver';
import { MemberService } from './member.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [MemberResolver, MemberService],
})
export class MemberModule {}
