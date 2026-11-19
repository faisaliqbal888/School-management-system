# 🎓 School Management System

A modern **School Management System (SMS)** that digitises school operations — students, staff,
attendance, exams, fees, timetable, library, transport, hostel, inventory and payroll — in one
role-based portal.

> **Status:** UI complete and building green · backend in development.
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
git clone https://github.com/faisaliqaliqbal888/School-management-system.git   # your fork
cd School-management-system
npm install                    # installs frontend + backend workspaces
```

### Frontend

```bash
cp frontend/.env.example frontend/.env.local
npm run dev:frontend           # http://localhost:3000
```

### Backend *(available once Phase 1 lands)*

```bash
cp backend/.env.example backend/.env
npm run dev:backend            # http://localhost:5000
```

### Demo login (temporary — removed in Phase 2)

| Role | Email | Password |
|---|---|---|
| Admin | `admin` | `admin` |
| Teacher | `teacher@gmail.com` | `teacher123` |
| Student | `student@gmail.com` | `student123` |

---

## 📦 Modules

| Module | Admin | Teacher | Student | Parent |
|---|:--:|:--:|:--:|:--:|
| Dashboard | ✅ | ✅ | ✅ | 🔜 |
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

| Phase | Scope |
|---|---|
| 0 ✅ | Restructure, build fixes, security upgrade, CI |
| 1 | Backend foundation, Prisma schema, seed |
| 2 | Real auth, RBAC, parent role |
| 3 | Students, teachers, classes, attendance, fees (full CRUD) |
| 4 | Exams, timetable, notifications, library, transport, hostel, inventory, HR |
| 5 | Live dashboards, reports, CSV/PDF exports |
| 6 | Mobile drawer, loading states, image optimisation, remove demo data |
| 7 | Tests, security pass, deployment |

Full detail: [`docs/PLAN.md`](docs/PLAN.md)

---

## 📄 License

MIT

## 📬 Contact

- GitHub: [@faisaliqbal888](https://github.com/faisaliqbal888)
- Project: [faisaliqbal888/School-management-system](https://github.com/faisaliqbal888/School-management-system)
