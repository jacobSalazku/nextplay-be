import { validateEnv } from '../env.validation';

const valid = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_PRIVATE_KEY_BASE64: 'cHJpdmF0ZQ==',
  JWT_PUBLIC_KEY_BASE64: 'cHVibGlj',
};

describe('validateEnv', () => {
  it('accepts a minimal valid environment', () => {
    expect(() => validateEnv(valid)).not.toThrow();
  });

  it('coerces numeric strings (PORT, token TTL)', () => {
    const out = validateEnv({
      ...valid,
      PORT: '3001',
      JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS: '900',
    });
    expect(out.PORT).toBe(3001);
    expect(out.JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS).toBe(900);
  });

  it('ignores unrelated process.env keys', () => {
    expect(() =>
      validateEnv({ ...valid, HOME: '/root', PATH: '/usr/bin' }),
    ).not.toThrow();
  });

  it.each([
    ['DATABASE_URL missing', { ...valid, DATABASE_URL: undefined }],
    ['JWT_PRIVATE_KEY_BASE64 empty', { ...valid, JWT_PRIVATE_KEY_BASE64: '' }],
    ['PORT out of range', { ...valid, PORT: '70000' }],
    ['NODE_ENV not an allowed value', { ...valid, NODE_ENV: 'staging' }],
    [
      'DEV_AUTH_ENABLED not a boolean string',
      { ...valid, DEV_AUTH_ENABLED: 'yes' },
    ],
    [
      'token TTL not positive',
      { ...valid, JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS: '-5' },
    ],
    ['FRONTEND_URL not a URL', { ...valid, FRONTEND_URL: 'not-a-url' }],
  ])('throws when %s', (_label, config) => {
    expect(() => validateEnv(config as Record<string, unknown>)).toThrow(
      /Invalid environment/,
    );
  });

  it('lists every failure in the message', () => {
    expect(() =>
      validateEnv({ JWT_PRIVATE_KEY_BASE64: 'x', JWT_PUBLIC_KEY_BASE64: 'y' }),
    ).toThrow(/DATABASE_URL/);
  });
});
