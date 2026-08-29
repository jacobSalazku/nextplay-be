# Architecture

External memory for this backend. Keep it current: when a decision changes
how the system works, update the relevant section here in the same PR.

## Stack

- **NestJS 11** on **Fastify**
- **GraphQL**, code-first (`@nestjs/graphql` + Apollo). Schema is generated at
  boot to `graphql/schema.graphql`; generated types to `graphql/generated/types.ts`.
  Both are committed so the frontend can run codegen offline.
- **Prisma 7** + **PostgreSQL** (pg adapter). Client generated to the default
  location.
- **Socket.IO** gateway for team join-request notifications (`TeamGateway`).

## Module layout

`src/modules/<domain>/` — one folder per domain (`activity`, `attendance`,
`gameplan`, `member`, `play`, `practice-preparation`, `statline`, `team`,
`user`). Each has `*.resolver.ts` / `*.service.ts` / `*.model.ts` / `dto.ts`.
Resolvers are thin; services hold the logic and own the data access.

`src/modules/auth/` — cross-cutting auth. `PrismaModule` is `@Global()`;
`AuthModule` is not — modules that need its exports import it explicitly.

## Authentication

- **Access tokens**: RS256 JWT, `{ sub, ver }` payload. `ver` is the user's
  `tokenVersion`; bumping it (logout, block) invalidates every outstanding
  access token. Verified in `JwtStrategy`.
- **`GqlJwtAuthGuard` is registered as a global `APP_GUARD`.** Every resolver
  requires a valid token by default. Opt a handler out with `@Public()`
  (`auth/decorator/public.decorator.ts`) — currently only `login`-family
  mutations and `_ping`.
- **Login**: `loginWithGoogle(idToken)` — the server verifies the Google ID
  token's signature and audience (`GOOGLE_CLIENT_ID`) and trusts the email
  only if Google reports it verified. No caller-supplied email is trusted.
  `devLogin(email)` is an email-only shortcut, hard-disabled unless
  `NODE_ENV !== 'production'` **and** `DEV_AUTH_ENABLED === 'true'`.
- **Refresh tokens**: opaque UUID stored in plaintext on `User.refreshToken`,
  rotated on use. Known gap — hashing + expiry + reuse detection is planned.
- `me` / `logout` are token-scoped to the caller.

### Required env

`DATABASE_URL`, `PORT`, `SOCKET_CORS_ORIGINS`, `JWT_PRIVATE_KEY_BASE64`,
`JWT_PUBLIC_KEY_BASE64`, `GOOGLE_CLIENT_ID` (= frontend `AUTH_GOOGLE_ID`),
optional `JWT_ACCESS_TOKEN_EXPIRES_IN_SECONDS`, `DEV_AUTH_ENABLED`. See
`.env.example`.

## Team authorization

**Decision.** All team-scoped access goes through one service instead of each
module re-deriving membership.

- **`TeamAccessService`** (`auth/team-access.service.ts`)
  - `resolveTeamId(ref)` — any public reference (id | shortId | routeKey |
    slug | code) → canonical team id. Use only for checkless lookups.
  - `requireMembership(ref, userId, role?)` — one query; asserts the user is
    an **ACTIVE** member (and optionally a `COACH`) and returns
    `{ teamId, memberId, role }`. A non-member gets a plain `403` whether or
    not the team exists.
- **`TeamMemberGuard` / `TeamCoachGuard`** (`auth/guards/team-access.guard.ts`)
  — pull the team ref from the resolver args (`input.routeKey` ?? `routeKey`
  ?? `input.teamId` ?? `teamId` ?? `input.teamShortId` ?? `teamShortId`),
  call `requireMembership`, and stash the result on `req.team`.
- **`@CurrentTeam()`** (`auth/decorator/current-team.decorator.ts`) — reads
  `req.team` in the resolver.

**Rules for team-scoped resolvers:**

1. Guard the resolver with `TeamMemberGuard` (reads) or `TeamCoachGuard`
   (coach-only writes).
2. Take `teamId` from `@CurrentTeam()`, not from the raw args.
3. **Every Prisma query includes `teamId` in its `where`.** Never
   `delete({ where: { id } })` on a user-supplied id — scope it:
   `deleteMany({ where: { id, teamId } })`.
4. When a write references child entities (activities, plays, members),
   verify each belongs to `teamId` before writing (see
   `statline.service.submitStatlines` for the reference implementation).

**Deprecated, do not use for new code:** `CoachGuard`
(`auth/guards/coach-guard.ts`) and `CurrentTeamId`
(`team/decorator/current-team.decorator.ts`). They predate the service, skip
the status check, and `CurrentTeamId` always returns `undefined`.

### Migration status

`TeamAccessService` + guards exist but are **not yet wired**. Resolvers still
using the old `CoachGuard` / ad-hoc checks, to be migrated:
`activity`, `attendance`, `member`, `play`, `team`, `gameplan`,
`practice-preparation`, `statline`. `gameplan` / `practice-preparation` /
`statline` / `user` already do their own correct `assertActiveMembership`;
the rest have gaps (some reads unscoped, `deleteActivity` was unguarded).

## Testing

- Jest, `*.spec.ts` under `src`. `test:e2e` for the (currently stub) e2e set.
- Unit-test service logic with a mocked `PrismaService` (see
  `auth/team-access.service.spec.ts`).
- `app.controller.spec.ts` is a broken create-nest-app scaffold — ignore /
  delete.

## Known gaps (not yet addressed)

- No `ValidationPipe` whitelist — input DTOs without decorators are
  unvalidated. `transform: true` is on.
- No rate limiting, query depth/complexity limits, or `formatError`.
- GraphQL `introspection` / `playground` are on unconditionally.
- Refresh tokens: plaintext, no expiry, no reuse detection.
- CORS origins are hardcoded in `main.ts`.
