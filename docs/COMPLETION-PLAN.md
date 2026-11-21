# Completion plan — what is actually left

Audited the repo at `a449b29` (PR #3). Everything claimed in `docs/PLAN.md` is
real; the gaps below are the honest remainder, found by reading the code rather
than the docs.

## Findings

| # | Gap | Evidence |
|---|---|---|
| 1 | **Operations modules are read-only.** Library has issue/return; transport, hostel, inventory and HR/Payroll are overview screens over data nothing can create. | `operations.routes.ts` has 12 endpoints, 11 `GET`s. No writes for vehicles, routes, rooms, allocations, stock, payroll runs, leave approvals. |
| 2 | **No file storage.** Student/teacher photos show an avatar placeholder. | `add-student-modal.tsx:244` "Photo upload arrives with file storage in a later phase". |
| 3 | **No bulk import.** Onboarding a school means typing 400 learners one at a time. | Nothing under `/students` accepts a file. |
| 4 | **No pagination/perf guardrails on exports.** PDF/CSV build everything in memory. | `reports.service.ts` — fine at demo size, not at year end. |
| 5 | **Ops docs lag the API.** Roadmap table still lists library/transport/hostel/inventory as "pending". | `docs/API.md` roadmap section. |

## Plan

### Step 1 — Operations write paths (backend)
Full CRUD + workflow for the four modules that only have overviews:
- Transport: vehicles (CRUD), routes (CRUD), assign learners to a route (seat-capacity check)
- Hostel: rooms (CRUD), allocate/vacate (capacity + double-booking guard)
- Inventory: items (CRUD), stock adjust with a reason (audited)
- HR: payroll run for a period (idempotent per staff+period), mark paid; leave
  request create + approve/reject

### Step 2 — Operations UI
Each admin page gains create/edit dialogs and the workflow actions
(allocate, vacate, adjust stock, run payroll, approve leave). Reuses the
RHF + zod patterns from Step 0 of the previous round.

### Step 3 — File uploads
`multer` in-memory → disk under `backend/uploads/<entity>/`, served statically
with an allowlist of mime types and a 2 MB cap. One endpoint: `POST /uploads/avatar`
(students, teachers, self). Wires the disabled avatar button.

### Step 4 — Bulk import
`POST /students/import` accepting CSV, parsed and validated row-by-row, with a
dry-run mode that returns per-row errors before anything is written. UI modal
with a template download.

### Step 5 — Docs + QA
Update `docs/API.md` (roadmap, endpoint map, new endpoints), `PLAN.md`, add
backend tests for every new endpoint, keep both suites green, PR description
refreshed.

## Explicit non-goals
- Real credential delivery at scale (already handled by Step 2 of the prior round).
- Report streaming (Step 4 is about import; exports stay in-memory but paginated
  at the query level).
- One-to-one chat (notices are the product's model).
