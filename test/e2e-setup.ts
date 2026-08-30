// Runs in the e2e worker before the app boots: point at the test DB and
// hand the app a throwaway RSA keypair + dev-login flag so a real session
// can be minted without any real secrets.
import { generateKeyPairSync } from 'node:crypto';
import { config } from 'dotenv';

config({ path: '.env.test', override: true, quiet: true });

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

process.env.JWT_PRIVATE_KEY_BASE64 = Buffer.from(privateKey).toString('base64');
process.env.JWT_PUBLIC_KEY_BASE64 = Buffer.from(publicKey).toString('base64');
process.env.DEV_AUTH_ENABLED = 'true';
process.env.GOOGLE_CLIENT_ID ??= 'test-client-id';
