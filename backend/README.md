# SMS Backend

Express 4 + TypeScript REST API for the School Management System.

| Concern | Choice |
|---|---|
| Runtime | Node 20+, ESM, TypeScript strict |
| Framework | Express 4 |
| Database | PostgreSQL 16 + Prisma 6 |
| Query engine | **WASM query compiler** (`engineType = "client"`) — no native binary |
| Validation | zod |
| Auth | JWT access tokens + rotating refresh tokens, bcrypt |
| Docs | [`../docs/API.md`](../docs/API.md) |

---

## Quick start

```bash
# 1. install (from the repo root — npm workspaces)
npm install

# 2. configure
cp backend/.env.example backend/.env
#    → set DATABASE_URL to your PostgreSQL instance

# 3. create the database (once)
createdb school_db          # or: psql -c 'CREATE DATABASE school_db'

# 4. apply the schema
npm run migrate:deploy --workspace=backend

# 5. generate the Prisma client
npm run prisma:generate --workspace=backend

# 6. seed a realistic school (optional, 80 students)
npm run db:seed --workspace=backend

# 7. run
npm run dev:backend
#    → http://localhost:5000/api/v1/health
```

---

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | tsx watch on `src/server.ts` |
| `npm run build` | `tsc` → `dist/` |
| `npm start` | run the compiled build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest |
| `npm run migrate:deploy` | apply pending migrations |
| `npm run migrate:status` | show migration state |
| `npm run prisma:generate` | generate the Prisma client |
| `npm run db:seed` | seed demo data |
| `npm run db:studio` | open Prisma Studio |
| `npm run db:reset` | drop, re-migrate and re-seed |

---

## Why `prisma:generate` is a script, not `prisma generate`

The Prisma CLI downloads ~20 MB native engine binaries from `binaries.prisma.sh`
the first time it runs. Many CI images and sandboxes block that host, which makes
`prisma generate` fail even though everything else works.

`scripts/generate-client.cjs` avoids that download entirely:

1. **`@prisma/prisma-schema-wasm`** parses and validates `schema.prisma` — this is
   the real Prisma engine compiled to WebAssembly, so validation is identical.
2. **`@prisma/client/generator-build`** — the actual client generator — is driven
   over its JSON-RPC protocol (the same way the CLI drives it).

Because the schema sets `engineType = "client"`, the generated client contains the
**WASM query compiler**, so there is no per-platform native binary at runtime
either. Connections go through `@prisma/adapter-pg`.

> On a machine with normal internet access you can still use
> `npx prisma generate` / `npx prisma migrate dev` — the schema and migrations are
> standard and fully compatible.

---

## Project layout

```
backend/
├── src/
│   ├── config/           env validation (zod), Prisma client
│   ├── middleware/       auth + RBAC, validation, rate limiting, error handler
│   ├── routes/           health, academic (v1)
│   ├── utils/            errors, response envelope, JWT, pagination, passwords
│   ├── app.ts            Express app factory (no listen → testable)
│   └── server.ts         bootstrap: DB check, listen, graceful shutdown
├── prisma/
│   ├── schema.prisma     34 models · 22 enums
│   ├── migrations/       hand-verified SQL, matches the schema exactly
│   └── seed.ts           realistic Pakistani school, PKR
├── scripts/
│   └── generate-client.cjs
└── tests/
```

---

## Conventions

- **Responses** — `{ success: true, data, meta? }` / `{ success: false, error: { code, message, details? } }`
- **Money** — `Decimal(12,2)`, PKR, never floats
- **Dates** — ISO 8601 UTC; calendar days are `DATE`
- **Errors** — typed `AppError` thrown from anywhere, mapped once in `error-handler.ts`
- **Validation** — zod at the route boundary; parsed values replace `req.body/query/params`
- **Auth** — `authenticate` then `authorize('ADMIN', …)`
- **Async** — wrap handlers in `asyncHandler` so rejections reach the error handler

---

## Demo accounts (after seeding)

Password for all: `Password123`

| Role | Email |
|---|---|
| Admin | `admin@ravischool.edu.pk` |
| Teacher | `ahmed.1@ravischool.edu.pk` |
| Student | `student@ravischool.edu.pk` |
| Parent | `parent@ravischool.edu.pk` |
