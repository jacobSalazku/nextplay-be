import { execSync } from 'node:child_process';
import { config } from 'dotenv';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', 'host.docker.internal']);

/**
 * Runs once before the whole suite. Two jobs:
 *  1. refuse to run unless DATABASE_URL is an isolated local `nextplay_test`
 *     database — so migrations / truncation can never reach the real
 *     (managed) DB;
 *  2. bring that test database up to the current schema.
 */
export default function globalSetup(): void {
  config({ path: '.env.test', override: true, quiet: true });

  const raw = process.env.DATABASE_URL ?? '';
  let host = '';
  let database = '';
  try {
    const parsed = new URL(raw);
    host = parsed.hostname;
    database = parsed.pathname.replace(/^\//, '').split('?')[0];
  } catch {
    // leave host/database empty -> rejected below
  }

  if (!LOCAL_HOSTS.has(host) || database !== 'nextplay_test') {
    const safe = raw.replace(/:\/\/[^@/]*@/, '://***@') || '<empty>';
    throw new Error(
      `Refusing to run tests: DATABASE_URL must be a local nextplay_test ` +
        `database (got "${safe}"). Start it with: pnpm test:db:up`,
    );
  }

  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: raw },
  });
}
