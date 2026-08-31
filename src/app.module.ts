import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { validateEnv } from './config/env.validation';
import './graphql/enums';
import { formatGraphqlError } from './graphql/format-error';
import { maxAliasesRule, maxDepthRule } from './graphql/query-limits';
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
import { RateLimitModule } from './modules/rate-limit/rate-limit.module';
import { PrismaModule } from './prisma/prisma.module';
import { RootResolver } from './root.resolver';

// Query-shape guards, enforced during validation (before any resolver or DB
// work). Deepest legitimate query today is depth 4 and nothing uses more than
// one alias. Raise the const if a real query ever legitimately exceeds a
// limit — don't exempt per-operation.
const MAX_QUERY_DEPTH = 8;
const MAX_QUERY_ALIASES = 15;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validate: validateEnv,
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

          // reject pathologically deep / alias-amplified queries up front
          validationRules: [
            maxDepthRule(MAX_QUERY_DEPTH),
            maxAliasesRule(MAX_QUERY_ALIASES),
          ],

          //code first schema output
          autoSchemaFile: join(process.cwd(), 'graphql/schema.graphql'),
          // `@as-integrations/fastify` calls this with (request, reply). We
          // forward `req` for the auth guards and `res` so the throttler guard
          // can write rate-limit headers onto the reply.
          context: (req: unknown, res: unknown) => ({ req, res }),

          //Generated types out of classes
          definitions: {
            path: join(process.cwd(), 'graphql/generated/types.ts'),
            outputAs: 'class',
          },
        };
      },
    }),
    // first, so its APP_GUARD runs before the auth guard
    RateLimitModule,
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
