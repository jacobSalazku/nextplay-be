import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GqlJwtAuthGuard } from '../auth/jwt-guard';
import { AttendanceResolver } from './attendance.resolver';
import { AttendanceService } from './attendance.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [AttendanceService, AttendanceResolver, GqlJwtAuthGuard],
})
export class AttendanceModule {}
