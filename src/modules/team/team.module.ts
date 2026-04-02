import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TeamResolver } from './team.resolver';
import { TeamService } from './team.service';

@Module({
  imports: [PrismaModule],
  providers: [TeamResolver, TeamService],
})
export class TeamModule {}
