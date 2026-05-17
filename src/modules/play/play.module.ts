import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PlayResolver } from './play.resolver';
import { PlayService } from './play.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [PlayResolver, PlayService],
})
export class PlayModule {}
