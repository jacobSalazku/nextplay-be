// Unit + integration specs (`*.spec.ts` under src/). The e2e suite has its
// own config at test/jest-e2e.json.
/** @type {import('jest').Config} */
module.exports = {
  rootDir: '.',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  moduleNameMapper: { '^src/(.*)$': '<rootDir>/src/$1' },
  testEnvironment: 'node',

  // The DB-backed specs share one `nextplay_test` database and each calls
  // `resetDb()` (TRUNCATE ... CASCADE) between tests. Run spec files serially
  // so one file's reset can't wipe rows another file is mid-test with —
  // otherwise: FK violations, "record not found", and TRUNCATE deadlocks.
  maxWorkers: 1,

  // one-time: guard the DB url, then run migrations against the test database
  globalSetup: '<rootDir>/test/global-setup.ts',
  // per worker: load .env.test so PrismaService sees the test DATABASE_URL
  setupFiles: ['<rootDir>/test/load-test-env.ts'],

  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
};
