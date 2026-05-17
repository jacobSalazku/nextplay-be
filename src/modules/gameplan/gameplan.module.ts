import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GameplanResolver } from './gameplan.resolver';
import { GameplanService } from './gameplan.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [GameplanResolver, GameplanService],
})
export class GameplanModule {}
