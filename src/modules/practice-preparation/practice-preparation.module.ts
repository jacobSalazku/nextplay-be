import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { PracticePreparationResolver } from './practice-preparation.resolver';
import { PracticePreparationService } from './practice-preparation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [PracticePreparationResolver, PracticePreparationService],
})
export class PracticePreparationModule {}
