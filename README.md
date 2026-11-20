# 🎓 School Management System

A modern **School Management System (SMS)** that digitises school operations — students, staff,
attendance, exams, fees, timetable, library, transport, hostel, inventory and payroll — in one
role-based portal.

> **Status:** Phases 0–3 complete · Phase 4 in progress — backend + UI live for auth, academics,
> students, teachers, attendance, fees, exams/results, timetable and notifications ·
> 102 backend tests green · frontend builds clean (all routes prerender).
> See [`docs/PLAN.md`](docs/PLAN.md) for the full review and roadmap.

---

## 📌 Stack (decided)

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · shadcn/ui · Recharts |
| Backend | Node 20 · Express 4 · TypeScript (strict) · zod |
| Database | PostgreSQL 16 · Prisma ORM |
| Auth | JWT access + refresh rotation · bcrypt · role-based access control |
| Currency / locale | PKR (Rs.) · English UI |

---

## 🗂️ Repository layout

```
School-management-system/
├── frontend/                 # Next.js app
│   ├── app/                  # /admin, /teacher, /student, /login routes
│   ├── components/           # UI primitives + feature components
│   ├── lib/                  # auth context, hooks, formatters
│   └── public/
├── backend/                  # Express + TypeScript API  (Phase 1)
├── docs/
│   ├── PLAN.md               # review + roadmap (read this first)
│   └── DECISIONS.md          # locked-in conventions
├── .github/workflows/ci.yml  # typecheck + build on every PR
└── package.json              # npm workspaces root
```

---

## 🚀 Getting started

```bash
git clone https://github.com/faisaliqbal888/School-management-system.git   # your fork
cd School-management-system
npm install                    # installs frontend + backend workspaces
```

### Frontend

```bash
cp frontend/.env.example frontend/.env.local
npm run dev:frontend           # http://localhost:3000
```

### Backend

```bash
cp backend/.env.example backend/.env
#   → set DATABASE_URL to a PostgreSQL 16 instance

npm run migrate:deploy --workspace=backend   # create the 34-model schema
npm run prisma:generate --workspace=backend  # generate the Prisma client
npm run db:seed --workspace=backend          # optional: demo school (80 students)
npm run dev:backend                          # http://localhost:5000/api/v1/health
```

No native Prisma engines are downloaded — the client uses a WASM query compiler,
so it works in restricted CI/sandbox environments. Details: [`backend/README.md`](backend/README.md).

### Accounts

**Seeded backend** (after `npm run db:seed`) — password `Password123`:

| Role | Email |
|---|---|
| Admin | `admin@ravischool.edu.pk` |
| Teacher | `ahmed.1@ravischool.edu.pk` |
| Student | `student@ravischool.edu.pk` |
| Parent | `parent@ravischool.edu.pk` |

The login page has one-click buttons for all four accounts.

---

## 📦 Modules

| Module | Admin | Teacher | Student | Parent |
|---|:--:|:--:|:--:|:--:|
| Dashboard | ✅ | ✅ | ✅ | ✅ |
| Students | ✅ | ✅ (own classes) | — | 🔜 |
| Teachers & Staff | ✅ | — | — | — |
| Attendance | ✅ | ✅ | ✅ view | 🔜 |
| Fees & Payments | ✅ | — | ✅ view | 🔜 |
| Exams & Results | ✅ | ✅ | ✅ view | 🔜 |
| Timetable | ✅ | ✅ | ✅ | 🔜 |
| Library | ✅ | — | — | — |
| Transport | ✅ | — | — | — |
| Hostel | ✅ | — | — | — |
| Inventory | ✅ | — | — | — |
| HR & Payroll | ✅ | — | — | — |
| Reports | ✅ | — | — | — |

✅ = built (UI) · 🔜 = planned

---

## 🧑‍💻 Development

```bash
npm run typecheck      # tsc --noEmit for both packages
npm run build          # production build
npm run lint           # lint rules
npm test               # backend tests
```

CI runs typecheck + build for the frontend and typecheck + tests for the backend on every PR.

---

## 🗺️ Roadmap

| Phase | Scope | Status |
|---|---|---|:--:|
| 0 | Restructure, build fixes, security upgrade, CI | ✅ |
| 1 | Backend foundation, 35-model schema, migrations, seed, academic API | ✅ |
| 2 | Real auth (JWT + refresh), RBAC, parent role, frontend login | ✅ |
| 3 | Students, teachers, attendance, fees — full CRUD + frontend wiring | ✅ |
| 4 | Exams ✅, timetable ✅, notifications ✅ · library, transport, hostel, inventory, HR next | ◐ |
| 5 | Live dashboards, reports, CSV/PDF exports | 🔜 |
| 6 | Mobile drawer, loading states, image optimisation, remove demo data | 🔜 |
| 7 | Tests, security pass, deployment | 🔜 |

Full detail: [`docs/PLAN.md`](docs/PLAN.md)

---

## 📄 License

MIT

## 📬 Contact

- GitHub: [@faisaliqbal888](https://github.com/faisaliqbal888)
- Project: [faisaliqbal888/School-management-system](https://github.com/faisaliqbal888/School-management-system)
