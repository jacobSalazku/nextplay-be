import { OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const adapter = new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    });

    super({ adapter });
  }

  async onModuleInit() {
    // SKIP_DB_CONNECT lets `NestFactory.create` build the module graph (and
    // generate the GraphQL schema) without a database — used by the
    // schema-drift check in CI.
    if (process.env.SKIP_DB_CONNECT === 'true') {
      return;
    }
    await this.$connect();
  }
}
