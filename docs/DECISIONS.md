# Design decisions — Phase 0

Locked-in conventions from the approved plan (`docs/PLAN.md`).

## Repository layout

```
/                → workspace root (scripts only)
/frontend        → Next.js 16 app (moved out of root in Phase 0)
/backend         → Express 4 + TypeScript API (Phase 1)
/docs            → PLAN.md, API.md
```

Root `npm install` uses npm workspaces and installs both packages.

## Frontend

| Concern | Decision |
|---|---|
| Framework | Next.js 16.4.6 (App Router, Turbopack), React 19.2 |
| Styling | Tailwind CSS 4 via `@tailwindcss/postcss`, shadcn/ui primitives |
| Fonts | System font stack only — **no Google Fonts fetch at build time** (offline/CI safe) |
| API access | Browser calls relative `/api/v1/*`; `next.config.mjs` rewrites to `BACKEND_URL` |
| Type safety | `ignoreBuildErrors` removed in Phase 0; `npm run typecheck` must stay clean |
| Currency | PKR, formatted as `Rs. 12,500` (see `frontend/lib/format.ts`) |
| Locale | English UI. Copy stays in components; no i18n framework yet (Urdu is optional later) |
| Auth (target) | Backend-issued JWT stored in an httpOnly cookie, no plaintext creds in the bundle |

## Backend (decided, to be built in Phase 1)

| Concern | Decision |
|---|---|
| Runtime | Node 20, Express 4, TypeScript strict, ESM |
| DB | PostgreSQL 16 + Prisma |
| Validation | zod schemas at the route boundary |
| Passwords | bcrypt, cost 12 |
| Tokens | JWT access 15m + refresh 7d with rotation, stored httpOnly |
| Roles | `admin`, `teacher`, `student`, `parent` (parent is new) |
| Errors | `{ success: false, error: { code, message, details? } }` |
| Success | `{ success: true, data, meta? }` |
| Money | `Decimal(12,2)` in Postgres — never floats |
| Dates | ISO 8601 UTC |

## Removing legacy code (done in Phase 0)

14 root-level pages duplicated `/admin/*` with a second, unguarded sidebar.
They were deleted; `/admin/*` is the single admin surface:

`/students`, `/teachers`, `/attendance`, `/exams`, `/fees`, `/timetable`,
`/notifications`, `/library`, `/transport`, `/hostel`, `/inventory`, `/hr`,
`/reports`, `/settings` → all removed, use `/admin/<module>` instead.

## Still in place after Phase 0 (addressed in later phases)

- `frontend/lib/auth-context.tsx` still contains the 3 demo users — replaced in Phase 2.
- Mock API routes under `frontend/app/api/admin/*` — replaced by the backend in Phase 3.
- Hardcoded demo arrays in components — replaced as each module is wired (Phases 3–5).
