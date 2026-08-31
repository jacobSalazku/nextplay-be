import { parseCorsOrigins } from '../cors';

const DEFAULTS = ['http://localhost:3000', 'http://localhost:3001'];

describe('parseCorsOrigins', () => {
  it('falls back to the local dev frontends when unset or blank', () => {
    expect(parseCorsOrigins(undefined)).toEqual(DEFAULTS);
    expect(parseCorsOrigins('')).toEqual(DEFAULTS);
    expect(parseCorsOrigins('   ')).toEqual(DEFAULTS);
  });

  it('parses a single origin', () => {
    expect(parseCorsOrigins('https://app.nextplay.io')).toEqual([
      'https://app.nextplay.io',
    ]);
  });

  it('parses a comma-separated list, trimming whitespace and empty segments', () => {
    expect(
      parseCorsOrigins('https://a.io, https://b.io ,,  https://c.io'),
    ).toEqual(['https://a.io', 'https://b.io', 'https://c.io']);
  });
});
