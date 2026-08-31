import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import './graphql/enums';
import { formatGraphqlError } from './graphql/format-error';
import { ActivityModule } from './modules/activity/activity.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AuthModule } from './modules/auth/auth.module';
import { GameplanModule } from './modules/gameplan/gameplan.module';
import { MemberModule } from './modules/member/member.module';
import { PlayModule } from './modules/play/play.module';
import { PracticePreparationModule } from './modules/practice-preparation/practice-preparation.module';
import { StatlineModule } from './modules/statline/statline.module';
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
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      // a factory so NODE_ENV is read at boot, not at module-import time
      useFactory: () => {
        const isProduction = process.env.NODE_ENV === 'production';

        return {
          // the deprecated GraphQL Playground is never served; the Apollo
          // landing page is dev-only; introspection is off in production.
          playground: false,
          introspection: !isProduction,
          plugins: isProduction
            ? []
            : [ApolloServerPluginLandingPageLocalDefault()],

          // strip internal detail from production error responses
          formatError: formatGraphqlError,

          //code first schema output
          autoSchemaFile: join(process.cwd(), 'graphql/schema.graphql'),
          context: (context: { req?: unknown; request?: unknown }) => ({
            req: context.req ?? context.request,
          }),

          //Generated types out of classes
          definitions: {
            path: join(process.cwd(), 'graphql/generated/types.ts'),
            outputAs: 'class',
          },
        };
      },
    }),
    ActivityModule,
    AttendanceModule,
    AuthModule,
    GameplanModule,
    MemberModule,
    PlayModule,
    PracticePreparationModule,
    PrismaModule,
    StatlineModule,
    TeamModule,
    UserModule,
  ],
  providers: [RootResolver],
})
export class AppModule {}
