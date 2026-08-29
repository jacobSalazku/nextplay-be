import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a resolver or handler as reachable without authentication.
 * Required because GqlJwtAuthGuard is registered globally (APP_GUARD),
 * so anything without @Public() is authenticated by default.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
