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

## Query parameters (list endpoints)

| Param | Type | Default | Notes |
|---|---|---|---|
| `page` | int ≥ 1 | 1 | |
| `limit` | int 1–100 | 20 | |
| `search` | string | — | Case-insensitive match |
| `sortBy` | string | model-specific | Whitelisted per endpoint |
| `sortOrder` | `asc` \| `desc` | `desc` | |

---

## Data model (34 tables)

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
| 4 | `/exams`, `/results`, `/timetable`, `/notifications`, `/library`, `/transport`, `/hostel`, `/inventory`, `/payroll` |
| 5 | `/dashboard/summary`, `/reports/*` |
