# School Management System — Review + Roadmap

> Status: **Approved plan** · Branch: `arena/78969c39-school-management-system`
> Decisions: **Express + TypeScript backend**, **PostgreSQL**, **delete legacy duplicate pages**, **English UI + PKR (Rs.)**

---

## 1. Where the project stands today

| Area | Reality |
|---|---|
| UI / design | ~85% done. 50 pages, 78 components, polished shadcn/ui + Recharts dashboard. |
| Real data | ~0%. 85 files contain hardcoded demo arrays. |
| API | 3 mock routes (`/api/admin/staff`, `/api/admin/payroll`, `/api/admin/students/[id]`) returning in-memory constants. |
| Auth | Fake. 3 users hardcoded in the **client bundle** with plaintext passwords, session in `localStorage`. No middleware, no server-side guard. |
| Database | None. |
| Tests / CI / lint | None. `eslint` script exists but eslint is not installed. |
| Build | ❌ Fails — `react-is` missing (recharts peer dep). 4 TS errors hidden by `ignoreBuildErrors: true`. |
| Next.js | 16.0.7 → **published security advisory**, upgrade required. |
| Assets | 31 MB uncompressed images in `public/`. |
| Mobile | Broken — fixed 256px sidebar always visible, no drawer. |
| Duplication | 14 legacy root pages (~1,110 LOC) mirror `/admin/*`; 2 sidebars, 2 headers. |

### Module readiness

| Module | UI | Persistence |
|---|---|---|
| Auth / Login | ✅ | 🔴 mock |
| Admin dashboard | ✅ | 🔴 static |
| Users | ✅ | 🔴 create is a no-op |
| Students / Teachers | ✅ | 🔴 demo table, add/edit no-op |
| Attendance | ✅ | 🟡 local marking only |
| Fees | ✅ | 🔴 demo invoices |
| Exams / Results | ✅ | 🔴 demo |
| Timetable, Library, Transport, Hostel, Inventory | ✅ | 🔴 demo |
| HR & Payroll | ✅ | 🟡 mock API + working CSV export |
| Reports | ✅ | 🔴 dead download button |
| Student / Teacher portals | ✅ | 🔴 demo |
| **Parent portal** | ❌ | ❌ promised in README, absent in code |

> **Note:** this table is the *original* audit (pre-Phase 0). Current state is tracked by the
> phase checklist in §3 and by the endpoint map in `API.md`.

---

## 2. Target repository layout

```
School-management-system/
├── frontend/                     # Next.js app (moved from root)
│   ├── app/  components/  lib/  public/  styles/
│   ├── package.json  tsconfig.json  next.config.mjs
│   └── .env.example
├── backend/                      # NEW — Express + TypeScript
│   ├── src/
│   │   ├── config/               # env, database, logger
│   │   ├── models/               # Prisma schema + seed
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/           # auth, RBAC, validate, error, rate-limit
│   │   ├── services/             # business logic
│   │   ├── utils/
│   │   └── server.ts
│   ├── prisma/schema.prisma
│   ├── tests/
│   ├── package.json  tsconfig.json
│   └── .env.example
├── docs/
│   ├── PLAN.md                   # this file
│   └── API.md
├── .github/workflows/ci.yml
├── package.json                  # root workspace scripts
└── README.md
```

---

## 3. Phases

### Phase 0 — Stabilize & restructure ✅ COMPLETE
- [x] Full code review + decisions captured
- [x] Move app into `frontend/`
- [x] Delete 14 legacy duplicate pages + 2 legacy layout components
- [x] Fix build: add `react-is`, remove `ignoreBuildErrors`, fix 4 TS errors
- [x] Upgrade Next.js `16.0.7` → `16.4.6` (security)
- [x] Pin all `"latest"` deps to exact installed versions
- [x] Remove Google-Fonts build-time fetch (offline/CI safe)
- [x] `.env.example`, GitHub Actions CI, root workspace scripts

### Phase 1 — Backend foundation ✅ COMPLETE
- Express + TS scaffold, config loader, Prisma + PostgreSQL
- Full schema: User, Student, Guardian, Teacher, Staff, Class, Section, Subject,
  Enrollment, Attendance, Exam, ExamResult, FeeStructure, Invoice, Payment,
  TimetableSlot, Notification, LibraryBook, BookIssue, TransportRoute, Vehicle,
  HostelRoom, InventoryItem, Payroll
- Migrations + realistic seed (Pakistan-context, PKR)
- Health check, error envelope, request logging, `docs/API.md`

### Phase 2 — Auth & RBAC ✅ COMPLETE
- bcrypt hashing, JWT access tokens + refresh rotation
- `authenticate` + `authorize(roles)` middleware
- **Parent role** added end-to-end
- Frontend: real login form → API, httpOnly cookie/token storage, role guards
- Server-side route protection (Next middleware / layout checks)

### Phase 3 — Core modules ✅ COMPLETE
Students · Teachers · Classes/Subjects · Attendance · Fees
Full CRUD API + validation (zod) + pagination/filter/sort + frontend wiring
- [x] Classes & sections screens (`/admin/classes`) and subjects (`/admin/subjects`) on top of
      full PATCH/DELETE endpoints; deletes refuse while enrolments, sections, marks or timetable
      slots still reference the row and explain what is attached

### Phase 4 — Secondary modules ✅ COMPLETE
Exams/Results · Timetable · Notifications · Library · Transport · Hostel · Inventory · HR/Payroll

### Phase 5 — Dashboards & Reports ✅ COMPLETE
Real aggregated stats, charts from DB, CSV/PDF export, admin report builder
- [x] PDF export alongside CSV (`/reports/export.pdf`) — A4 landscape, school masthead, page-break
      headers, generated-at footer; both formats share one data path

### Phase 6 — Frontend cleanup ✅ COMPLETE
- [x] Mobile drawer navigation (shared `mobile-nav.tsx` on all four roles)
- [x] Remove dead demo arrays, mock API routes and orphan components
- [x] Loading / empty states on the rebuilt pages
- [x] **Route-level `error.tsx` / `not-found.tsx` / `loading.tsx`** — root plus per-role
      boundaries sharing `RoleErrorState`
- [x] **Image optimisation** — 61 unreferenced assets deleted (`public/` 31 MB → 876 KB), the
      Next optimiser re-enabled (AVIF/WebP) and avatars defer loading
- [x] **Form validation with RHF + zod** — `components/ui/form.tsx` primitives plus
      `lib/validation/schemas.ts`. Every form is migrated: users, subjects, classes/sections,
      settings, add/edit student, add/edit teacher, raise invoice, record payment, schedule exam,
      timetable slot, compose notice and the account/security forms. Per-field messages replace the
      old single `setError` banner, and a failed multi-tab submit jumps to the tab owning the error.

### Phase 6b — Security hardening ✅ COMPLETE
- [x] Account lockout (5 failures → 15 min) with `auth.lockout` audit entries and dummy-hash
      verification so timing cannot be used to enumerate accounts
- [x] Strong password policy shared by change-password and every account-creation path
- [x] CSRF double-submit tokens for cookie-authenticated writes
- [x] Session management (list/revoke devices), password change revokes all sessions
- [x] Self-service `PATCH /auth/profile` — role and email are no longer mass-assignable
- [x] Admin audit-log API and screen with filters and pagination
- [x] `/account/security` page for every role; bulk attendance is now one statement

### Phase 7 — QA & deploy ✅ COMPLETE
- [x] API + integration tests — 145 across 12 files
- [x] Security pass — Helmet, CORS allowlist, `express-rate-limit`, zod on every body
- [x] **Test coverage:** `students`, `teachers` and `academic` suites added — every route file
      now has tests (220 total across 16 files), including a dedicated `security.test.ts`
- [x] **Lint runnable** — ESLint 9 flat config (Next 16 removed `next lint`), `npm run lint`
      reports 0 errors, and CI runs it before typecheck
- [x] **Deploy** — `backend/Dockerfile` (multi-stage, non-root, HEALTHCHECK), `railway.json`,
      `frontend/vercel.json` with security headers, and `docs/DEPLOYMENT.md`
- [x] **Production seed path** — `scripts/create-admin.ts` bootstraps the first admin from env
      vars; `seed.ts` now refuses to run with `NODE_ENV=production`

---

## 4. Conventions locked in

| Concern | Decision |
|---|---|
| Backend | Node 20 + Express 4 + TypeScript (strict) |
| ORM / DB | Prisma + PostgreSQL 16 |
| Validation | zod (shared schemas) |
| Auth | JWT (15 min) + refresh rotation (7 days), bcrypt cost 12 |
| Currency | PKR, formatted `Rs. 12,500` via `Intl.NumberFormat('en-PK')` |
| Locale | English UI now; i18n-ready structure, Urdu later optional |
| Money in DB | `Decimal` / integer paisa — never floats |
| Errors | `{ success: false, error: { code, message, details? } }` |
| Success | `{ success: true, data, meta? }` |
| Dates | ISO 8601 UTC |
