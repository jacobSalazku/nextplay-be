import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * A plain PrismaClient pointed at the test database. Shared by every spec so
 * we open one pool, not one per file. `.env.test` is already loaded by
 * `test/load-test-env.ts` (Jest `setupFiles`) before this module is imported.
 */
export const testPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

/**
 * Wipe every table (except the migrations ledger) and reset identity
 * sequences. Call in `beforeEach` for specs that touch the database so each
 * test starts from empty.
 */
export async function resetDb(): Promise<void> {
  const rows = await testPrisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;

  if (rows.length === 0) return;

  const list = rows.map((r) => `"public"."${r.tablename}"`).join(', ');
  await testPrisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`,
  );
}
