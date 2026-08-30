// Runs in every Jest worker before the test framework loads, so
// `PrismaService`'s constructor (`process.env.DATABASE_URL`) sees the test
// database. `.env` / `.env.local` are deliberately not touched here.
import { config } from 'dotenv';

config({ path: '.env.test', override: true, quiet: true });
