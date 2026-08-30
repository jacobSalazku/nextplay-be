import { execSync } from 'node:child_process';
import { config } from 'dotenv';

const REDACT = /:\/\/[^@]*@/;

/**
 * Runs once before the whole suite. Two jobs:
 *  1. refuse to run unless DATABASE_URL is an isolated local *_test database —
 *     so migrations / truncation can never reach the real (managed) DB;
 *  2. bring that test database up to the current schema.
 */
export default function globalSetup(): void {
  config({ path: '.env.test', override: true, quiet: true });

  const url = process.env.DATABASE_URL ?? '';
  const host = /:\/\/[^@]*@([^:/]+)/.exec(url)?.[1] ?? '';
  const isLocalHost = [
    'localhost',
    '127.0.0.1',
    'host.docker.internal',
  ].includes(host);
  const isTestDb = /\/nextplay_test(\?|$)/.test(url);

  if (!isLocalHost || !isTestDb) {
    throw new Error(
      `Refusing to run tests: DATABASE_URL must be a local nextplay_test database ` +
        `(got "${url.replace(REDACT, '://***@') || '<empty>'}"). ` +
        `Start it with: pnpm test:db:up`,
    );
  }

  execSync('pnpm prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: url },
  });
}
