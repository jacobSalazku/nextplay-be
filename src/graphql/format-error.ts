import { Logger } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';

const logger = new Logger('GraphQL');

const INTERNAL = 'INTERNAL_SERVER_ERROR';

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
 */
export function formatGraphqlError(
  formatted: GraphQLFormattedError,
  original: unknown,
  isProduction = process.env.NODE_ENV === 'production',
): GraphQLFormattedError {
  if (!isProduction) return formatted;

  const code = formatted.extensions?.code;

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
