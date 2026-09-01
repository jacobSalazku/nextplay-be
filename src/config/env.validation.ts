import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  Min,
  validateSync,
} from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  DATABASE_URL!: string;

  @IsString()
  @IsNotEmpty()
  JWT_PRIVATE_KEY_BASE64!: string;

  @IsString()
  @IsNotEmpty()
  JWT_PUBLIC_KEY_BASE64!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS?: number;

  /** Refresh-token lifetime in days (default 30). */
  @IsOptional()
  @IsInt()
  @IsPositive()
  REFRESH_TOKEN_TTL_DAYS?: number;

  /**
   * Seconds a just-rotated refresh token stays usable, to absorb concurrent
   * refreshes from multiple tabs / parallel SSR (default 10). Past this window,
   * reusing a rotated token is treated as theft.
   */
  @IsOptional()
  @IsInt()
  @Min(0)
  REFRESH_TOKEN_GRACE_SECONDS?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsIn(['development', 'production', 'test'])
  NODE_ENV?: string;

  @IsOptional()
  @IsString()
  GOOGLE_CLIENT_ID?: string;

  /** Sentry DSN. Unset = error reporting is a no-op. */
  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  SENTRY_DSN?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  DEV_AUTH_ENABLED?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  FRONTEND_URL?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true })
  NEXT_PUBLIC_APP_URL?: string;

  /** Comma-separated list of allowed browser origins. */
  @IsOptional()
  @IsString()
  CORS_ORIGIN?: string;

  @IsOptional()
  @IsIn(['true', 'false'])
  SKIP_DB_CONNECT?: string;

  /** Escape hatch for load testing / incidents. */
  @IsOptional()
  @IsIn(['true', 'false'])
  THROTTLE_DISABLED?: string;
}

/**
 * `ConfigModule.forRoot({ validate })` — runs once at boot on the merged env
 * (`.env` files + `process.env`). Throws a readable list on failure so a
 * misconfigured deploy stops instead of failing cryptically deep in startup.
 */
export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors
      .map((e) => `  - ${Object.values(e.constraints ?? {}).join('; ')}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  return validated;
}
