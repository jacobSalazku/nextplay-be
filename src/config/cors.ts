const DEFAULT_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

/**
 * Allowed browser origins for CORS. `CORS_ORIGIN` is a comma-separated list;
 * unset falls back to the local dev frontends. Never `*` — the API sends
 * credentials, and browsers reject `*` with credentials anyway.
 */
export function parseCorsOrigins(
  value: string | undefined = process.env.CORS_ORIGIN,
): string[] {
  if (!value?.trim()) return DEFAULT_ORIGINS;

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
