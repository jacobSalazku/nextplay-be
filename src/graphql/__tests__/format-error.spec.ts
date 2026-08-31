import { Logger } from '@nestjs/common';
import type { GraphQLFormattedError } from 'graphql';
import { formatGraphqlError } from '../format-error';

describe('formatGraphqlError', () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });
  afterEach(() => jest.restoreAllMocks());

  const internal: GraphQLFormattedError = {
    message:
      'Invalid `prisma.user.create()` — Unique constraint failed on email',
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
      stacktrace: ['at ...'],
    },
  };

  describe('outside production', () => {
    it('returns the error untouched', () => {
      expect(formatGraphqlError(internal, new Error('x'), false)).toBe(
        internal,
      );
    });
  });

  describe('in production', () => {
    it('replaces an internal error with a generic message and logs the original', () => {
      const cause = new Error('boom');
      const out = formatGraphqlError(internal, cause, true);

      expect(out).toEqual({
        message: 'Internal server error',
        extensions: { code: 'INTERNAL_SERVER_ERROR' },
      });
      expect(errorSpy).toHaveBeenCalledWith(cause.stack);
    });

    it('masks an error that carries no extensions code', () => {
      const out = formatGraphqlError({ message: 'unexpected' }, {}, true);
      expect(out.message).toBe('Internal server error');
    });

    it.each([
      'FORBIDDEN',
      'BAD_REQUEST',
      'UNAUTHENTICATED',
      'NOT_FOUND',
      'GRAPHQL_VALIDATION_FAILED',
    ])('passes a %s error through, trimming extensions to the code', (code) => {
      const out = formatGraphqlError(
        {
          message: 'Not a member of this team',
          path: ['getGameplan'],
          locations: [{ line: 1, column: 8 }],
          extensions: { code, originalError: { statusCode: 403 } },
        },
        undefined,
        true,
      );

      expect(out.message).toBe('Not a member of this team');
      expect(out.extensions).toEqual({ code });
      expect(out.path).toEqual(['getGameplan']);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
