# SMS API — Reference

Base URL: `http://localhost:5000/api/v1`
Frontend proxies `/api/v1/*` → this backend (see `frontend/next.config.mjs`).

---

## Response envelope

Every endpoint returns one of these two shapes.

**Success**
```json
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 80, "totalPages": 4 } }
```
`meta` is present on paginated list endpoints only.

**Failure**
```json
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Request validation failed",
  "details": [{ "path": "name", "message": "Required", "code": "invalid_type" }] } }
```

### Error codes

| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/query failed zod validation |
| `BAD_REQUEST` | 400 | Malformed request |
| `UNAUTHORIZED` | 401 | Missing / expired / invalid access token |
| `FORBIDDEN` | 403 | Authenticated but role not allowed |
| `NOT_FOUND` | 404 | Resource does not exist |
| `CONFLICT` / `DUPLICATE` | 409 | Unique constraint violated |
| `FOREIGN_KEY_VIOLATION` | 400 | Referenced record missing |
| `TOO_MANY_REQUESTS` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Authentication

### Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | — (rate-limited 10/15min) | `{ email, password }` → `{ user, accessToken, refreshToken }` + httpOnly cookies |
| POST | `/auth/refresh` | refresh token | Rotates the pair; reuse revokes every session for that user |
| POST | `/auth/logout` | access token | Revokes the refresh token and clears cookies → 204 |
| GET | `/auth/me` | access token | Current user + role profile |
| POST | `/auth/change-password` | access token | `{ currentPassword, newPassword, confirmPassword }`, signs out other devices |

### Tokens

- **Access token** — JWT, 15 min, sent as `Authorization: Bearer …` *or* the
  `access_token` httpOnly cookie (browsers).
- **Refresh token** — 48 random bytes, stored only as a SHA-256 hash, 7 days,
  `refresh_token` httpOnly cookie scoped to `/api/v1/auth`.
- **Rotation** — every refresh revokes the old token. Presenting an already-used
  token is treated as theft: all sessions for that user are revoked and an
  `auth.refresh_reuse` audit entry is written.

Login failures always return the same message (`Invalid email or password`) so
accounts cannot be enumerated.

### Session payload

```json
{
  "user": {
    "id": "…", "email": "student@ravischool.edu.pk", "name": "Anaya Abbasi",
    "role": "STUDENT", "phone": "+92…", "avatarUrl": "/emma-student.jpg",
    "profile": {
      "studentId": "…", "admissionNo": "ADM-2025-0001", "rollNo": "6A01",
      "classId": "…", "className": "Grade 6", "level": 6,
      "sectionId": "…", "sectionName": "A", "status": "ACTIVE"
    }
  }
}
```

`profile` depends on the role:

| Role | `profile` keys |
|---|---|
| `STUDENT` | `studentId, admissionNo, rollNo, classId, className, level, sectionId, sectionName, status` |
| `TEACHER` | `teacherId, employeeNo, department, designation, status, subjects[], classTeacherOf` |
| `PARENT` | `parentId, children[{ studentId, name, admissionNo, className }]` |
| `ADMIN` | `isAdmin: true` |

### Using a token

Send the access token on every protected request:

```
Authorization: Bearer <accessToken>
```

A cookie named `access_token` is accepted as a fallback.

### CSRF protection

Cookie-authenticated writes are protected against cross-site request forgery using the
double-submit pattern:

1. `GET /api/v1/csrf` returns `{ csrfToken }` and sets a **readable** `csrf_token` cookie.
2. Echo the value in an `X-CSRF-Token` header on every `POST`, `PATCH`, `PUT` and `DELETE`.

Requests authenticated with `Authorization: Bearer …` are exempt (no ambient cookie), and so are
requests that carry no `refresh_token` cookie at all. A cookie-auth write without a matching header
is rejected with `403 CSRF_TOKEN_INVALID`. The bundled frontend does this automatically in
`lib/api-client.ts`.

| Role | Access |
|---|---|
| `ADMIN` | everything |
| `TEACHER` | own classes, attendance, results |
| `STUDENT` | own records (read-only) |
| `PARENT` | linked children (read-only) |

---

## Endpoints

### Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Liveness probe (uptime, version) |
| GET | `/health/ready` | — | Readiness probe — checks PostgreSQL |

### Academic structure

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/academic-years` | any | List academic years, newest first |
| POST | `/academic-years` | ADMIN | Create a year; `isCurrent: true` clears the previous current year |
| GET | `/classes` | any | Paginated classes. Query: `page`, `limit`, `search`, `sortBy`, `sortOrder`, `academicYearId` |
| POST | `/classes` | ADMIN | Create class — `name`, `level`, `academicYearId`, `classTeacherId?`, `capacity?` |
| GET | `/classes/:classId/sections` | any | Sections of a class |
| POST | `/sections` | ADMIN | Create section — `classId`, `name`, `roomNo?`, `capacity?` |
| GET | `/subjects` | any | Paginated subjects. Query: `page`, `limit`, `search`, `sortBy`, `sortOrder`, `classId` |
| POST | `/subjects` | ADMIN | Create subject — `name`, `code`, `classId`, `isElective?`, `creditHours?` |

#### Example

```bash
curl localhost:5000/api/v1/classes?page=1&limit=5&sortBy=level \
  -H "Authorization: Bearer $TOKEN"
```


### Students — Phase 3 ✅

Role-scoped: ADMIN sees everyone, TEACHER sees students in sections they teach,
STUDENT sees only themselves, PARENT sees their linked children.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/students` | any | Paginated + `search`, `classId`, `sectionId`, `status`, `gender`, `sortBy` (name · admissionNo · createdAt) |
| GET | `/students/export.csv` | ADMIN, TEACHER | CSV of the current filters |
| GET | `/students/:id` | scoped | Full record: guardians, attendance rate, results, fee totals |
| POST | `/students` | ADMIN | Create — auto `ADM-YYYY-NNNN` + temp password. Returns `{ student, credentials }` |
| PATCH | `/students/:id` | ADMIN | Update profile, status, guardian, or move section (re-enrolls) |
| DELETE | `/students/:id` | ADMIN | Soft withdraw → `WITHDRAWN` + login disabled. `?hard=true` purges |
| POST | `/students/import` | ADMIN | Bulk CSV import. Body `{ csv, dryRun=true, defaultPassword? }`. Returns `{ dryRun, total, imported, skipped, errors[{row,email,message}], sample? }` |

### Bulk import — CSV (Students) ✅

`POST /students/import` · ADMIN only · body `{ csv: string (1–2 MB), dryRun?: boolean = true, defaultPassword?: string }`

The importer is **dry-run first by design**: a school uploads one file for a whole intake, so every
problem must be visible *before* an account exists. Re-run with `dryRun: false` to create the rows
that passed.

| Column | Required | Notes |
|---|---|---|
| `name` | ✅ | min 2 chars |
| `email` | ✅ | unique; duplicates **inside the file** are flagged (first occurrence wins) |
| `date_of_birth` | ✅ | `YYYY-MM-DD` or `DD/MM/YYYY`, must be in the past |
| `gender` | ✅ | `MALE`/`FEMALE`/`OTHER`, aliases `M`/`F`/`O`, `Male`/`Female`, `Boy`/`Girl` |
| `guardian_name` | ✅ | |
| `guardian_relation` | — | defaults to `Guardian` |
| `guardian_phone` | ✅ | ≥ 7 digits after stripping non-digits |
| `phone`, `city`, `address`, `guardian_email` | — | copied through when present |

Response:

```json
{
  "dryRun": true,
  "total": 3,
  "imported": 2,
  "skipped": 1,
  "errors": [{ "row": 4, "email": "bad@x", "message": "Email is not valid" }],
  "sample": { "email": "…", "temporaryPassword": "…" }
}
```

- `row` is the **spreadsheet row number** (header is row 1), so it lines up with Excel.
- A dry run also checks for existing accounts, so 2 clean runs never turn into a failed import.
- Each passing row is created through the normal `createStudent` path — same admission-number
  sequence, same temporary-password rule, same audit entry.
- The UI ships a template download (`students-import-template.csv`) and shows the error table
  before enabling the Import button.

### Teachers — Phase 3 ✅

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/teachers` | any | Paginated + `department`, `status`, `employmentType`, `search`. Salary/email hidden from students & parents |
| GET | `/teachers/filters` | any | Departments, designations, subjects for UI dropdowns |
| GET | `/teachers/export.csv` | ADMIN | CSV of the current filters |
| GET | `/teachers/:id` | ADMIN, self | Class load, subject assignments, latest payslip, recent leave |
| POST | `/teachers` | ADMIN | Create — auto `EMP-YYYY-NNN` + temp password. Returns `{ teacher, credentials }` |
| PATCH | `/teachers/:id` | ADMIN | Update record/subjects; RESIGNED & TERMINATED disable the login |
| DELETE | `/teachers/:id` | ADMIN | Soft terminate (keeps history). `?hard=true` purges when no timetable remains |

### Attendance — Phase 3 ✅

ADMIN may mark any section; a TEACHER only sections they teach (timetable ∪ subject
assignments); STUDENT/PARENT get read-only scoped history. Re-submitting a day upserts.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/attendance/sections` | ADMIN, TEACHER | Sections the actor can mark, with student counts |
| GET | `/attendance/overview` | ADMIN, TEACHER | Today's totals + per-section completion |
| GET | `/attendance/summary` | any | Rate + monthly trend. Scoped by role; staff may pass `sectionId` or `studentId` |
| GET | `/attendance/roster/:sectionId?date=YYYY-MM-DD` | ADMIN, TEACHER | Roster with existing marks and a status summary |
| GET | `/attendance` | any | Paginated history — `studentId`, `sectionId`, `status`, `from`, `to`, `search` |
| POST | `/attendance/bulk` | ADMIN, TEACHER | `{ sectionId, date, entries:[{ studentId, status, remarks? }] }` |

Statuses: `PRESENT | ABSENT | LATE | EXCUSED | HOLIDAY`. Future dates are rejected.

### Fees — Phase 3 ✅

ADMIN has full control; STUDENT/PARENT see only their own invoices & payments;
TEACHER is blocked from learner financial data.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/fees/summary` | ADMIN, STUDENT, PARENT | Billed/paid/outstanding, collection rate, status counts, month collections |
| GET | `/fees/structures` | ADMIN | Fee structures with invoice counts |
| POST | `/fees/structures` | ADMIN | `{ name, classId, amount, frequency?, dueDay?, subjectId? }` |
| GET | `/fees/invoices` | ADMIN, STUDENT, PARENT | Paginated — `status`, `studentId`, `classId`, `period`, `search`. `meta` also carries totals |
| GET | `/fees/invoices/:id` | scoped | Invoice + payment history |
| POST | `/fees/invoices` | ADMIN | Manual invoice with `discount` / `fine` / `period` / `dueDate` |
| POST | `/fees/invoices/generate` | ADMIN | Bulk monthly raise for one structure — idempotent per period |
| PATCH | `/fees/invoices/:id/waive` | ADMIN | `{ reason }`; refused when the invoice already has payments |
| POST | `/fees/payments` | ADMIN | `{ invoiceId, amount, method?, reference? }` → receipt no, new balance, status |
| GET | `/fees/payments` | ADMIN, STUDENT, PARENT | Receipt ledger, scoped by role |

Invoice statuses: `PENDING | PARTIAL | PAID | OVERDUE | CANCELLED | WAIVED` — overdue is
refreshed on every read. Payments: `CASH | BANK_TRANSFER | CARD | ONLINE | CHEQUE`.

---

## Exams, marks & report cards

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/exams` | authenticated | Paginated — `classId`, `subjectId`, `type`, `status`, `search` |
| POST | `/exams` | ADMIN, TEACHER | `{ title, classId, subjectId, type, date, startTime?, endTime?, totalMarks, passingMarks, sectionId? }` |
| GET | `/exams/:id` | scoped | Exam with roster and stats |
| PATCH | `/exams/:id/status` | ADMIN | `SCHEDULED → ONGOING → COMPLETED → PUBLISHED`; publishing needs ≥1 result |
| DELETE | `/exams/:id` | ADMIN | Removes exam and its results |
| GET | `/exams/:id/marks` | ADMIN, TEACHER | Marks roster — every active student of the section |
| POST | `/exams/:id/marks` | ADMIN, TEACHER | `{ entries: [{ studentId, marksObtained \| null, remarks? }] }` — null clears; locked once published |
| GET | `/exams/:id/analysis` | ADMIN, TEACHER | Count, average, highest/lowest, pass rate, grade bands, toppers |
| GET | `/results` | scoped | Published results; learners see only their own (parents: their children) |
| GET | `/results/transcript` | STUDENT, PARENT | `?studentId=` for parents — per-subject history + overall % |

Grading: `A+ ≥90 · A ≥80 · B ≥70 · C ≥60 · D ≥50 · E ≥40 · F <40`. A learner passes when
`marksObtained ≥ passingMarks`. Marks are frozen once an exam is `PUBLISHED`.

---

## Timetable

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/timetable/me` | authenticated | Own section (learner/parent) or own schedule (teacher) |
| GET | `/timetable/today` | authenticated | Today's classes — dashboard widget, `isCurrent` flag per slot |
| GET | `/timetable/options` | ADMIN, TEACHER | Classes + sections + subjects + active teachers for the editor |
| GET | `/timetable/section/:sectionId` | scoped | Weekly grid; learners/parents limited to their own sections |
| GET | `/timetable/teacher[/:teacherId]` | ADMIN, TEACHER | One teacher's schedule (teachers: self only) |
| POST | `/timetable/slots` | ADMIN | `{ classId, sectionId?, subjectId, teacherId?, dayOfWeek, startTime, endTime, roomNo? }` |
| PATCH | `/timetable/slots/:id` | ADMIN | Partial update |
| DELETE | `/timetable/slots/:id` | ADMIN | Remove a period |

Times are `HH:MM` (24h); `endTime` must be after `startTime`. Two conflicts are rejected with
`409`: the same section already has a lesson at that day/period, or the teacher is already booked
elsewhere at that time. Subject must belong to the chosen class (`400`).

---

## Notifications

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/notifications` | authenticated | Inbox — audience-scoped, `unreadOnly`, `audience`, `search` |
| GET | `/notifications/unread-count` | authenticated | `{ total, unread }` for the badge |
| GET | `/notifications/options` | ADMIN, TEACHER | Allowed audiences + classes (teachers: own classes only) |
| GET | `/notifications/stats` | ADMIN | Total notices, active accounts, read counts for recent notices |
| POST | `/notifications` | ADMIN, TEACHER | `{ title, body, audience, classId?, channel? }` |
| POST | `/notifications/read-all` | authenticated | Marks every visible notice read → `{ marked }` |
| GET | `/notifications/:id` | scoped | Single notice — 404 when outside your audience |
| PATCH | `/notifications/:id` | authenticated | `{ read: true \| false }` toggles the read receipt |
| DELETE | `/notifications/:id` | ADMIN, TEACHER | Admin deletes any; teachers only their own |

Audiences: `ALL · ADMINS · TEACHERS · STUDENTS · PARENTS · CLASS`. Read state is per user
(`notification_reads`), so a broadcast stays unread until each account opens it. Teachers may
target `STUDENTS`, `PARENTS` or one of their own classes — never `ALL` or another class.

### Outbound email & SMS

`POST /notifications` accepts `channel: IN_APP | EMAIL | SMS`. The in-app row is always written
first, then delivery is attempted, so a provider outage can never lose the notice.

```json
{
  "success": true,
  "data": {
    "id": "cm…",
    "delivery": { "attempted": 214, "sent": 211, "failed": 3, "channels": ["EMAIL"] }
  }
}
```

- Recipients for **EMAIL** are the active accounts in the audience (class-scoped for `CLASS`).
- Recipients for **SMS** are guardian phone numbers — parents are who a school texts. A guardian
  with two children in the same class is messaged once.
- Delivery is **off unless configured** (`DELIVERY_ENABLED=true` plus `EMAIL_API_URL` /
  `SMS_API_URL`). While off, the notice is saved and `delivery.attempted` is `0`.
- Sends run with a 10 s timeout and 5-way concurrency; individual failures are logged and counted,
  never thrown into the request.

Supported transport shapes (see `backend/.env.example`): `EMAIL_PROVIDER=generic` posts
`{from,to,subject,text}` / `{to,message}` with a bearer token to your URL; `EMAIL_PROVIDER=resend`
uses Resend's email schema.

---

## Dashboards

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/dashboard/summary` | authenticated | One role-shaped payload — see below |

The response is shaped by role so the UI can never render data the caller isn't entitled to:

| Role | Payload |
|---|---|
| ADMIN | `counts` (students/teachers/sections/classes/exams/notices), `attendance` (today + 7-day trend), `fees` (billed/paid/outstanding/collectionRate/overdue), `recentStudents`, `exams` (upcoming), `today` (lessons), `academicYear` |
| TEACHER | `teacher` (designation/department/employeeNo), `counts` (lessons/sections/classes/subjects/students), `sections` (own, with head-counts), `attendance` (own sections), `exams` (own), `today` (own lessons) — **no `fees` key at all** |
| STUDENT | `students` (self), `counts`, `attendance` (own), `fees` (own invoices only), `results` (own published results), `today` (own section's lessons) |
| PARENT | same as STUDENT across every linked child |

Attendance trends cover the trailing 7 days and carry `present / absent / late / total / rate`.
A learner with no linked student record gets an empty but well-formed payload (`fees: null`).

---

## Reports (ADMIN only)

| Method | Path | Description |
|---|---|---|
| GET | `/reports/fees` | Per class: students, invoices, billed, paid, outstanding, collection rate, overdue |
| GET | `/reports/attendance?days=30` | Per section: roster size, marks, present/absent/late, rate (1–365 days) |
| GET | `/reports/performance` | Latest completed/published exams: results, average, highest, lowest, pass rate |
| GET | `/reports/enrolment` | Per class: sections, capacity, students, utilisation, gender and status split |
| GET | `/reports/export?type=fees\|attendance\|performance\|enrolment&days=30` | CSV download (`text/csv`, `Content-Disposition: attachment`) |

Every figure is computed on read — no materialised tables — and both the CSV and the PDF are
generated from exactly the same rows the UI renders, so the two downloads can never disagree.

`GET /reports/export?type=fees|attendance|performance|enrolment[&days=30]` → `text/csv`
`GET /reports/export.pdf?…` → `application/pdf`, A4 landscape with the school masthead, zebra
striped rows, repeated header on page breaks and a generated-at footer (PDFKit; no browser).
Teachers and learners receive `403`.

---

## Operations — library, transport, hostel, inventory, HR

Staff-only (`ADMIN` writes, `TEACHER` reads where noted). Learners and parents receive `403`.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/library/overview` | ADMIN, TEACHER | Titles, copies, on-loan, overdue, per-category breakdown |
| GET | `/library/books` | ADMIN, TEACHER | Paginated catalogue — `search` (title/author/ISBN), `category` |
| GET | `/library/issues` | ADMIN, TEACHER | Loan ledger — `status` (`ISSUED`/`OVERDUE`/`RETURNED`), `search` |
| POST | `/library/issues` | ADMIN | `{ bookId, studentId, dueDate }` — refuses when no copies remain |
| PATCH | `/library/issues/:id/return` | ADMIN | `{ fine? }` — restores availability, rejects a second return |
| POST | `/library/refresh-overdue` | ADMIN | Flags past-due `ISSUED` loans as `OVERDUE` → `{ updated }` |
| GET | `/transport/overview` | ADMIN, TEACHER | Routes with assigned vehicle, riders, seats, monthly fees |
| GET | `/transport/routes/:id/riders` | ADMIN, TEACHER | Students on a route with pick-up stop |
| GET | `/hostel/overview` | ADMIN, TEACHER | Rooms by block, beds, occupancy, residents, monthly revenue |
| GET | `/inventory/overview` | ADMIN, TEACHER | Stock register, valuation per item and category, low-stock flags |
| GET | `/hr/payroll?period=` | ADMIN | Payslips for one period (defaults to newest) + totals/head-count |
| GET | `/hr/leaves` | ADMIN | Latest 50 leave requests with status |

Issuing a book decrements `availableCopies`; returning it increments the same column, so the
catalogue stays consistent without a separate stock table.

---

## Account & security

Available to every authenticated role — a user always acts on **their own** account.

| Method | Path | Description |
|---|---|---|
| GET | `/auth/sessions` | Active refresh tokens: `id`, `userAgent`, `ipAddress`, `createdAt`, `expiresAt` |
| DELETE | `/auth/sessions/:id` | Revoke one of *your own* sessions (someone else's returns 400) |
| DELETE | `/auth/sessions` | Revoke every session except the current one → `{ revoked }` |
| PATCH | `/auth/profile` | `{ name?, phone?, avatarUrl? }` — role and email are **not** accepted |
| POST | `/auth/change-password` | `{ currentPassword, newPassword, confirmPassword }`, revokes all sessions |

### Password policy

New passwords must be 10–128 characters and contain an uppercase letter, a lowercase letter and a
digit. Common passwords (`password123`, `qwerty123`, `admin123`, …), single repeated characters and
starting sequences such as `1234` / `qwer` are rejected. The same rule applies to change-password,
student and teacher creation, and admin-created accounts. Violations return `400 VALIDATION_ERROR`.

### Brute-force lockout

Five consecutive failures lock the account for 15 minutes (`users.lockedUntil`). The response stays
`401` but switches to *"Too many failed attempts…"*, and an `auth.lockout` audit entry is written.
A successful sign-in clears the counter. Unknown emails are verified against a dummy hash so timing
does not reveal whether an account exists.

---

## Administration — users, settings and alerts

`ADMIN` only; every other role receives `403`.

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | Directory — `page`, `limit`, `role`, `status`, `search`; payload adds `stats` |
| POST | `/admin/users` | `{ name, email, password, role, phone? }` — 400 on a duplicate email |
| PATCH | `/admin/users/:id/status` | `{ status: ACTIVE \| INACTIVE \| SUSPENDED }` — self-change is refused |
| POST | `/admin/users/:id/reset-password` | Issues a one-time password, revokes refresh tokens |
| GET | `/admin/staff` | Admin-office staff directory (teaching staff live on `/teachers`) |
| GET | `/admin/settings` | Ten known keys, each with `source: database \| default` |
| PATCH | `/admin/settings` | `{ updates: [{ key, value }] }` — unknown keys reject the whole batch |
| GET | `/admin/alerts` | Alerts derived on read from fees, attendance, library, inventory, HR |
| GET | `/admin/audit-logs` | Immutable audit trail — `page`, `limit`, `action`, `userId`, `from`, `to` |

Suspending an account blocks sign-in immediately. Alerts are **not stored** — each one is a live
query, so fixing the underlying record clears the alert on the next refresh.

---

## Query parameters (list endpoints)

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | |
| `limit` | int 1–100 | 20 | |
| `search` | string | — | Case-insensitive match |
| `sortBy` | string | model-specific | Whitelisted per endpoint |
| `sortOrder` | `asc` \| `desc` | `desc` | |

---

## Data model (35 tables)

```
User ─┬─ Student ──── Guardian / Enrollment / Attendance / ExamResult
      │              / Invoice / BookIssue / HostelAllocation / StudentRoute
      ├─ Teacher ──── TeacherSubject / SubjectAssignment / TimetableSlot
      │              / Exam / Payroll / LeaveRequest
      └─ Parent ───── Guardian

AcademicYear ── Class ─┬─ Section ── Attendance / TimetableSlot / Exam / Invoice
                       ├─ Subject ── Exam / ExamResult / FeeStructure
                       └─ Enrollment
FeeStructure ── Invoice ── Payment
Book ── BookIssue        Vehicle ── TransportRoute ── StudentRoute
HostelRoom ── HostelAllocation            InventoryItem
Staff ── Payroll / LeaveRequest           Notification / AuditLog / RefreshToken
```

Money columns are `DECIMAL(12,2)` in PKR. Dates are UTC; calendar days use `DATE`.

---

## Testing

```
npm test                 # backend (needs DATABASE_URL + migrated schema) then frontend
npm run test:backend
npm run test:frontend
```

Backend suites hit a real Postgres through supertest; frontend suites are DOM-free Vitest checks of
`lib/validation/schemas.ts` and `lib/api-client.ts` (CSRF header, one-shot refresh on 401, error
envelope). CI runs both.

## Roadmap for the API surface

| Phase | Adds |
|---|---|---|
| 2 ✅ | `/auth/*` (login, refresh, logout, me, change-password) · parent role |
| 3 ✅ | `/students`, `/teachers`, `/attendance`, `/fees/*` |
| 4 | `/exams`, `/results` ✅ · `/timetable` ✅ · `/notifications` ✅ · `/library`, `/transport`, `/hostel`, `/inventory`, `/payroll` pending |
| 5 ✅ | `/dashboard/summary`, `/reports/*` incl. CSV export |

---

## Endpoint map (all modules)

Every route below is served under `/api/v1` and shares the envelope
`{ success, data, meta? }` / `{ success, error: { code, message, details? } }`.

| Area | Endpoints |
|---|---|
| Health | `GET /health`, `GET /health/ready` |
| Auth | `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `GET /auth/me`, `PATCH /auth/me/password` |
| Academics | `GET/POST/PATCH/DELETE /classes`, `/sections`, `/subjects`, `/academic-years`, `GET /classes/:id/sections` |
| Students | `GET/POST /students`, `GET/PATCH/DELETE /students/:id`, `GET /students/:id/attendance`, `/students/:id/invoices` |
| Teachers | `GET/POST /teachers`, `GET/PATCH/DELETE /teachers/:id`, `GET /teachers/options` |
| Attendance | `POST /attendance/bulk`, `GET /attendance?classId&sectionId&date`, `GET /attendance/summary`, `GET /attendance/today` |
| Fees | `GET /fees/structures`, `GET /fees/summary`, `POST /fees/generate`, `GET /fees/invoices`, `POST /fees/payments` |
| Exams | `GET/POST /exams`, `GET/PATCH /exams/:id`, `POST /exams/:id/results`, `GET /exams/results`, `GET /results/transcript` |
| Timetable | `GET/POST /timetable`, `DELETE /timetable/:id`, `GET /timetable/me`, `GET /timetable/options` |
| Notifications | `GET/POST /notifications`, `GET /notifications/unread-count`, `/options`, `/stats`, `POST /notifications/read-all`, `PATCH /notifications/:id` |
| Dashboards | `GET /dashboard/summary` (role-aware) |
| Reports | `GET /reports/fees`, `/attendance`, `/performance`, `/enrolment`, `/export` (CSV), `/export.pdf` (PDF) |
| Operations | `GET /library/overview`, `/library/books`, `/library/issues`, `POST /library/issues`, `PATCH /library/issues/:id/return`, `POST /library/refresh-overdue`, `GET /transport/overview`, `/transport/routes/:id/riders`, `GET /hostel/overview`, `GET /inventory/overview`, `GET /hr/payroll`, `/hr/leaves` · **writes:** `POST/PATCH /transport/vehicles`, `/transport/routes`, `/transport/assignments` + `DELETE` for each, `POST/PATCH /hostel/rooms`, `/hostel/allocations`, `POST /hostel/allocations/:id/vacate`, `POST/PATCH /inventory/items`, `POST /inventory/items/:id/adjust`, `POST/PATCH /hr/staff`, `/hr/payroll` + `/hr/payroll/:period/pay`, `POST /hr/leaves`, `PATCH /hr/leaves/:id` |
| Uploads | `POST /uploads/avatar` (multipart, PNG/JPEG/WebP ≤ 2 MB), `DELETE /uploads/avatar`, static `GET /uploads/avatars/:file` |
| Administration | `GET/POST /admin/users`, `PATCH /admin/users/:id/status`, `POST /admin/users/:id/reset-password`, `GET /admin/staff`, `GET/PATCH /admin/settings`, `GET /admin/alerts` |
