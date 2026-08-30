import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

/**
 * Each Jest worker gets its own database (`nextplay_test_w<id>`), cloned from
 * the migrated template in `test/global-setup.ts`. So `resetDb()` only ever
 * touches this worker's rows — spec files run in parallel without racing.
 */
function workerUrl(): string {
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error('DATABASE_URL is not set');
  const id = process.env.JEST_WORKER_ID ?? '1';
  const u = new URL(base);
  u.pathname = `/nextplay_test_w${id}`;
  return u.toString();
}

export const testPrisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: workerUrl() }),
});

/**
 * Wipe every table (except the migrations ledger) and reset identity
 * sequences. Call in `beforeEach` for specs that touch the database.
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
