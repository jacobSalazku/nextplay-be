import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { join } from 'path';
import { RootResolver } from './root.resolver';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

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
      context: ({ req }) => ({
        req,
      }),

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
    PrismaModule,
  ],
  providers: [RootResolver],
})
export class AppModule {}
