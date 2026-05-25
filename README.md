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

## Scripts

```bash

```
