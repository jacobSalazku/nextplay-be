import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { ActivityModule } from './modules/activity/activity.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { TeamModule } from './modules/team/team.module';
import { UserModule } from './modules/user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { RootResolver } from './root.resolver';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: true,

      //code first schema output
      autoSchemaFile: join(process.cwd(), 'graphql/schema.graphql'),
      introspection: true,
      context: (context: { req?: unknown; request?: unknown }) => {
        return {
          req: context.req ?? context.request,
        };
      },

      // plugins:
      //   process.env.NODE_ENV !== 'production'
      //     ? [
      //         ApolloServerPluginLandingPageLocalDefault() as ApolloServerPlugin<any>,
      //       ]
      //     : [],

      //Generated types out of classes
      definitions: {
        path: join(process.cwd(), 'graphql/generated/types.ts'),
        outputAs: 'class',
      },
    }),
    AuthModule,
    UserModule,
    TeamModule,
    ActivityModule,
    AttendanceModule,
    PrismaModule,
  ],
  providers: [RootResolver],
})
export class AppModule {}
