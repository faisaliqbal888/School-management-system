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

Every figure is computed on read — no materialised tables — and the CSV is generated from exactly
the same rows the UI renders. Teachers and learners receive `403`.

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

## Roadmap for the API surface

| Phase | Adds |
|---|---|---|
| 2 ✅ | `/auth/*` (login, refresh, logout, me, change-password) · parent role |
| 3 ✅ | `/students`, `/teachers`, `/attendance`, `/fees/*` |
| 4 ◐ | `/exams`, `/results` ✅ · `/timetable` ✅ · `/notifications` ✅ · `/library`, `/transport`, `/hostel`, `/inventory`, `/payroll` pending |
| 5 ✅ | `/dashboard/summary`, `/reports/*` incl. CSV export |
