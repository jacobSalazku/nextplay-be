// Runs in the e2e worker before the app boots: point at this worker's database
// and hand the app a throwaway RSA keypair + dev-login flag so a real session
// can be minted without any real secrets.
import { generateKeyPairSync } from 'node:crypto';
import { config } from 'dotenv';

config({ path: '.env.test', override: true, quiet: true });

// Match test/db.ts — the app's PrismaService and the test factories must share
// one database.
const id = process.env.JEST_WORKER_ID ?? '1';
const url = new URL(process.env.DATABASE_URL ?? '');
url.pathname = `/nextplay_test_w${id}`;
process.env.DATABASE_URL = url.toString();

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.env.JWT_PRIVATE_KEY_BASE64 = Buffer.from(privateKey).toString('base64');
process.env.JWT_PUBLIC_KEY_BASE64 = Buffer.from(publicKey).toString('base64');
process.env.DEV_AUTH_ENABLED = 'true';
process.env.GOOGLE_CLIENT_ID ??= 'test-client-id';
