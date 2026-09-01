/**
 * One-off: run every stored rich-text field through the same sanitizer the
 * write paths now use, so rows created before `fix/sanitize-rich-text` can't
 * carry stale script payloads. Idempotent — safe to run more than once.
 *
 *   pnpm exec ts-node -r tsconfig-paths/register -P tsconfig.json \
 *     scripts/backfill-sanitize-rich-text.ts
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { sanitizeRichText } from '../src/common/sanitize-rich-text';

config({ path: '.env.local' });
config({ path: '.env' });

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function backfill<T extends { id: string }>(
  label: string,
  rows: T[],
  field: keyof T,
  update: (id: string, value: string) => Promise<unknown>,
): Promise<void> {
  let changed = 0;
  for (const row of rows) {
    const current = (row[field] ?? '') as string;
    const clean = sanitizeRichText(current);
    if (clean !== current) {
      await update(row.id, clean);
      changed += 1;
    }
  }
  console.log(`${label}: ${changed}/${rows.length} rewritten`);
}

async function main(): Promise<void> {
  await backfill(
    'Play.description',
    await prisma.play.findMany({ select: { id: true, description: true } }),
    'description',
    (id, description) =>
      prisma.play.update({ where: { id }, data: { description } }),
  );

  await backfill(
    'GamePlan.notes',
    await prisma.gamePlan.findMany({ select: { id: true, notes: true } }),
    'notes',
    (id, notes) => prisma.gamePlan.update({ where: { id }, data: { notes } }),
  );

  await backfill(
    'PracticePreparation.notes',
    await prisma.practicePreparation.findMany({
      select: { id: true, notes: true },
    }),
    'notes',
    (id, notes) =>
      prisma.practicePreparation.update({ where: { id }, data: { notes } }),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
