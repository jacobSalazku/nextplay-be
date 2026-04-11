import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { TeamGateway } from './team.gateway';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [TeamResolver, TeamService, TeamGateway],
})
export class TeamModule {}
