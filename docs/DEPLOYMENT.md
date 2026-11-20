# Deploying the School Management System

Two deployables, one repository:

| Part | Host | What it needs |
|---|---|---|
| `frontend/` (Next.js 16) | Vercel | `BACKEND_URL` pointing at the API |
| `backend/` (Express + Prisma) | Railway / Render / any Docker host | `DATABASE_URL` (Postgres) + two JWT secrets |

The browser only ever talks to the frontend origin — `next.config.mjs` rewrites
`/api/v1/*` to the API — so the frontend and backend may live on different hosts
without CORS changes.

---

## 1. Database

Any PostgreSQL 16 instance works (Railway, Neon, Supabase, RDS). You need the
connection string in the form:

```
postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
```

## 2. Backend

### Railway (config is checked in)

`railway.json` builds `backend/Dockerfile` and health-checks `/api/v1/health`.

1. Create a project → **Deploy from GitHub repo**.
2. Add a **PostgreSQL** plugin; Railway injects `DATABASE_URL`.
3. Set the variables below.
4. Deploy. The container starts `node dist/server.js` and reports healthy once
   the database answers.

### Any Docker host

```bash
docker build -f backend/Dockerfile -t sms-api .
docker run -p 5000:5000 --env-file backend/.env sms-api
```

The image runs as the unprivileged `node` user and ships a `HEALTHCHECK`.

### Required environment

| Variable | Notes |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Postgres connection string |
| `JWT_ACCESS_SECRET` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | a **different** `openssl rand -hex 32` |
| `CORS_ORIGINS` | your frontend origin, e.g. `https://sms.example.pk` |
| `PORT` | defaults to `5000`; most PaaS inject their own |

### Migrations

```bash
npm run migrate:deploy --workspace=backend
```

The SQL is checked in under `backend/prisma/migrations/`, so no schema engine
download is required at runtime.

### First administrator — do **not** run the demo seed in production

```bash
ADMIN_EMAIL=head@school.pk \
ADMIN_PASSWORD='a-long-unique-passphrase' \
ADMIN_NAME='Head Teacher' \
npm run admin:create --workspace=backend
```

The script is idempotent: it exits without changes when any admin already
exists. `prisma/seed.ts` wipes every table and creates accounts with the
publicly documented password `Password123`; it now **refuses to run** when
`NODE_ENV=production` unless `ALLOW_PROD_SEED=true` is set explicitly.

## 3. Frontend

1. Import the repo into Vercel, set **Root Directory** to `frontend`.
2. `frontend/vercel.json` pins the framework, build command and security
   headers (referrer policy, nosniff, frame options, permissions policy).
3. Environment:

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://your-api.up.railway.app` |

`NEXT_PUBLIC_API_BASE_URL` stays empty in the normal setup; the rewrite keeps
requests same-origin so the httpOnly refresh cookie is first-party.

## 4. Verify a deployment

```bash
curl -fsS https://your-api.up.railway.app/api/v1/health
curl -fsS https://your-api.up.railway.app/api/v1/health/ready   # checks the DB
curl -fsS -o /dev/null -w '%{http_code}\n' https://sms.example.pk/login
```

Then sign in as the administrator created above and confirm
`/admin/dashboard` renders live figures.

## 5. Backups

- Enable the host's automated Postgres snapshots (Railway: *Backups* tab).
- Application-level export exists for the large tables: `/reports/export?type=…`
  returns CSV for fees, attendance, performance and enrolment.

## 6. CI

`.github/workflows/ci.yml` runs on every PR to `main`:

- **frontend** — `npm ci` → `npm run lint` → `typecheck` → `next build`
- **backend** — Postgres 16 service → `prisma:generate` → `migrate:deploy` →
  `typecheck` → `vitest run` (190 tests)
