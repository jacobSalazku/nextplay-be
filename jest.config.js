const { cpus } = require('node:os');

// Keep this <= the worker-DB count created in test/global-setup.ts
// (min(cpus, 8)), so every Jest worker has a database to connect to.
const MAX_WORKERS = Math.max(1, Math.min(cpus().length - 1, 7));

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
  maxWorkers: MAX_WORKERS,

  // one-time: guard the DB url, migrate a template, clone one DB per worker
  globalSetup: '<rootDir>/test/global-setup.ts',
  // per worker: load .env.test so PrismaService sees the test DATABASE_URL
  setupFiles: ['<rootDir>/test/load-test-env.ts'],

  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
};
