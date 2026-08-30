import { execSync } from 'node:child_process';
import { cpus } from 'node:os';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', 'host.docker.internal']);
const TEMPLATE = 'nextplay_test_template';

/** Same URL, different database name. */
function withDatabase(url: string, database: string): string {
  const u = new URL(url);
  u.pathname = `/${database}`;
  return u.toString();
}

/**
 * Runs once before the whole suite:
 *  1. refuse to run unless DATABASE_URL is an isolated local `nextplay_test`
 *     database — migrations / truncation can never reach the real DB;
 *  2. migrate a `*_template` database once, then clone one throwaway database
 *     per Jest worker (`nextplay_test_w1`, `_w2`, …) from it. Each worker
 *     truncates only its own DB, so spec files run in parallel safely.
 */
export default async function globalSetup(): Promise<void> {
  config({ path: '.env.test', override: true, quiet: true });

  const raw = process.env.DATABASE_URL ?? '';
  let host = '';
  let database = '';
  try {
    const parsed = new URL(raw);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, '').split('?')[0];
  } catch {
    // leave empty -> rejected below
  }

  if (!LOCAL_HOSTS.has(host) || database !== 'nextplay_test') {
    const safe = raw.replace(/:\/\/[^@/]*@/, '://***@') || '<empty>';
    throw new Error(
      `Refusing to run tests: DATABASE_URL must be a local nextplay_test ` +
        `database (got "${safe}"). Start it with: pnpm test:db:up`,
    );
  }

  const admin = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: withDatabase(raw, 'postgres'),
    }),
  });

  try {
    await admin.$executeRawUnsafe(
      `DROP DATABASE IF EXISTS "${TEMPLATE}" WITH (FORCE)`,
    );
    await admin.$executeRawUnsafe(`CREATE DATABASE "${TEMPLATE}"`);

    execSync('pnpm prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: withDatabase(raw, TEMPLATE) },
    });

    const workerCount = Math.max(1, Math.min(cpus().length, 8));
    for (let w = 1; w <= workerCount; w += 1) {
      const name = `nextplay_test_w${w}`;
      await admin.$executeRawUnsafe(
        `DROP DATABASE IF EXISTS "${name}" WITH (FORCE)`,
      );
      await admin.$executeRawUnsafe(
        `CREATE DATABASE "${name}" TEMPLATE "${TEMPLATE}"`,
      );
    }
  } finally {
    await admin.$disconnect();
  }
}
