import { Logger } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';

const logger = new Logger('GraphQL');

const INTERNAL = 'INTERNAL_SERVER_ERROR';
const TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS';

/**
 * Production error hygiene for the GraphQL layer.
 *
 * - Outside production: return the error untouched (full detail for debugging).
 * - In production:
 *   - unhandled / internal errors (`INTERNAL_SERVER_ERROR` or no code — an
 *     unexpected `TypeError`, a Prisma constraint error, …) → generic message,
 *     the real error is logged server-side.
 *   - errors with a real code (`FORBIDDEN`, `BAD_REQUEST`, `UNAUTHENTICATED`,
 *     `NOT_FOUND`, `GRAPHQL_VALIDATION_FAILED`, …) → message kept, `extensions`
 *     trimmed to just the code (drops `originalError`, which leaks the HTTP
 *     status and Nest's internal error label).
 *   - rate-limit rejections (HTTP 429) → the Apollo driver labels these
 *     `INTERNAL_SERVER_ERROR`; re-surface them as `TOO_MANY_REQUESTS` so a
 *     client can tell it's being throttled and back off.
 */
export function formatGraphqlError(
  formatted: GraphQLFormattedError,
  original: unknown,
  isProduction = process.env.NODE_ENV === 'production',
): GraphQLFormattedError {
  if (!isProduction) return formatted;

  const code = formatted.extensions?.code;

  if (formatted.extensions?.status === 429) {
    return {
      message: 'Too many requests',
      extensions: { code: TOO_MANY_REQUESTS },
    };
  }

  if (code === undefined || code === INTERNAL) {
    logger.error(
      original instanceof Error
        ? (original.stack ?? original.message)
        : String(original),
    );
    return { message: 'Internal server error', extensions: { code: INTERNAL } };
  }

  return { ...formatted, extensions: { code } };
}
