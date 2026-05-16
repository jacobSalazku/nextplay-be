import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StatlineResolver } from './statline.resolver';
import { StatlineService } from './statline.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [StatlineService, StatlineResolver],
})
export class StatlineModule {}
