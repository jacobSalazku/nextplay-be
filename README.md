# NextPlay Backend (`nextplay-be`)

Backend API for the NextPlay basketball coaching platform.

This service is built with NestJS + GraphQL + Prisma and powers:

- team and membership management
- join moderation flows
- activities (games/practices)
- attendance tracking
- plays, gameplans, and practice preparations
- statlines and statistics endpoints
- realtime team events over Socket.IO

## Tech Stack

- NestJS (Fastify adapter)
- GraphQL (code-first)
- Prisma + PostgreSQL
- JWT authentication + role guards
- Socket.IO gateways

## Core Domains

Main modules in `src/modules`:

- `auth`
- `user`
- `team`
- `member`
- `activity`
- `attendance`
- `play`
- `gameplan`
- `practice-preparation`
- `statline`

## Environment Variables

Create `.env.local` (or `.env`) with at least:

```env
DATABASE_URL=
PORT=3001
SOCKET_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
JWT_PRIVATE_KEY_BASE64=
JWT_PUBLIC_KEY_BASE64=
```

Notes:

- `JWT_*_BASE64` should be base64-encoded key values used for signing/verifying access tokens.
- `PORT` defaults to `3001` if not set.

## Local Development

Install dependencies:

```bash
pnpm install
```

Run in watch mode:

```bash
pnpm run dev
```

GraphQL endpoint:

```text
http://localhost:3001/graphql
```

## Database

Run migrations (if your workflow uses them):

```bash
pnpm prisma migrate dev
```

Seed sample data:

```bash
pnpm run seed
```

## Generated GraphQL Artifacts

On startup, Nest generates:

- schema: `graphql/schema.graphql`
- type definitions: `graphql/generated/types.ts`

## Testing

**Stack:** Jest + `@nestjs/testing` + `ts-jest`. Unit/integration specs are
`*.spec.ts` next to the source; e2e lives in `test/`.

Requires **Docker Desktop** running — `pnpm test` auto-starts a throwaway
Postgres (`docker-compose.test.yml`, port 5433) and never touches the real
database. A guard in `test/global-setup.ts` aborts if `DATABASE_URL` is
anything other than a local `nextplay_test` database.

```bash
pnpm test          # unit + integration (starts the test DB first)
pnpm test:cov      # with coverage
pnpm test:e2e      # full HTTP → GraphQL → DB
pnpm test:db:down  # stop + delete the test DB container
```

### Every test is AAA — Arrange, Act, Assert

Three blocks, a blank line between each.

```ts
it('rejects a non-member with 403', async () => {
  // Arrange — set up only what this test needs
  await makeMember({ teamId: 't1', role: 'PLAYER' }); // someone else, not this user

  // Act — the one call under test
  const call = service.requireMembership('t1', 'outsider');

  // Assert — one logical outcome
  await expect(call).rejects.toBeInstanceOf(ForbiddenException);
});
```

### Rules

- **Test behaviour, not implementation** — assert on return values and side
  effects, never private methods or "was this internal line called".
- **Name tests as sentences** describing the rule: `it('trims the ref before lookup')`.
- **One reason to fail per test.**
- **Isolated** — `beforeEach` resets state; no test depends on another's order.
- **Factories over fixtures** — `makeMember({ role: 'COACH' })`, not a copied object.
- **Don't test** types (tsc covers them), framework internals, or third-party libs.
- **Coverage is a diagnostic, not a target.** Priority: authorization/security
  rules → pure business logic → critical user flows.

### Database

Guards, resolvers, and any Prisma query logic run against the **real test
database** (`docker-compose.test.yml`, truncated between tests via
`resetDb()`). A mocked Prisma cannot prove a query actually filters by
membership. Pure logic (builders, stat math) is tested at the same level —
the nested Prisma writes are the thing worth verifying.

### E2E

`test/*.e2e-spec.ts` boot the whole Nest app (Fastify + Apollo) with a
throwaway RSA keypair, and drive it over HTTP with `supertest`. `auth.e2e-spec`
covers the real flow: `devLogin` → session → a `TeamMemberGuard` query
returns 200 for a member, 403 for a non-member, 401 with no token, and
`devLogin` is refused unless `DEV_AUTH_ENABLED=true`.
