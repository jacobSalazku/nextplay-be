import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UserResolver } from './user.resolver';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [UserResolver, UserService],
})
export class UserModule {}
