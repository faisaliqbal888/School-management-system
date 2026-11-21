import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { parseCsvTable } from '../utils/csv.js'
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js'
import { hashPassword } from '../utils/password.js'
import { buildMeta, type PaginationMeta } from '../utils/response.js'
import type { PaginationQuery } from '../utils/pagination.js'

/**
 * Students module.
 *
 * Access rules (enforced here, not only in the routes, so every caller is safe):
 *   ADMIN    — everything
 *   TEACHER  — students in the classes/sections they teach
 *   STUDENT  — only their own record
 *   PARENT   — only their linked children
 */

export interface Actor {
  id: string
  role: Role
}

// ─────────────────────────────────────────────────────────────
//  list
// ─────────────────────────────────────────────────────────────

export interface StudentListFilters extends PaginationQuery {
  classId?: string
  sectionId?: string
  status?: string
  gender?: string
}

export interface StudentListItem {
  id: string
  admissionNo: string
  rollNo: string | null
  name: string
  email: string
  phone: string | null
  className: string | null
  sectionName: string | null
  gender: string
  status: string
  avatarUrl: string | null
  parentName: string | null
  guardianPhone: string | null
}

/** Restricts a query to what this actor is allowed to see. */
async function scopeFor(actor: Actor): Promise<Prisma.StudentWhereInput> {
  if (actor.role === 'ADMIN') return {}

  if (actor.role === 'STUDENT') {
    return { userId: actor.id }
  }

  if (actor.role === 'PARENT') {
    return { guardians: { some: { parent: { userId: actor.id } } } }
  }

  // TEACHER — students enrolled in a section where they have a subject assignment.
  const teacher = await prisma.teacher.findUnique({
    where: { userId: actor.id },
    select: { id: true },
  })
  if (!teacher) return { id: '__none__' }

  const sections = await prisma.timetableSlot.findMany({
    where: { teacherId: teacher.id, sectionId: { not: null } },
    select: { sectionId: true },
    distinct: ['sectionId'],
  })
  const sectionIds = sections.map((s) => s.sectionId).filter((s): s is string => s !== null)

  const enrollments = await prisma.enrollment.findMany({
    where: { sectionId: { in: sectionIds }, status: 'ACTIVE' },
    select: { studentId: true },
  })

  return { id: { in: enrollments.map((e) => e.studentId) } }
}

export async function listStudents(
  actor: Actor,
  filters: StudentListFilters,
): Promise<{ items: StudentListItem[]; meta: PaginationMeta }> {
  const scope = await scopeFor(actor)

  const where: Prisma.StudentWhereInput = {
    AND: [
      scope,
      filters.classId ? { classId: filters.classId } : {},
      filters.sectionId
        ? { enrollments: { some: { sectionId: filters.sectionId, status: 'ACTIVE' } } }
        : {},
      filters.status ? { status: filters.status as never } : {},
      filters.gender ? { gender: filters.gender as never } : {},
      filters.search
        ? {
            OR: [
              { admissionNo: { contains: filters.search, mode: 'insensitive' } },
              { rollNo: { contains: filters.search, mode: 'insensitive' } },
              { user: { name: { contains: filters.search, mode: 'insensitive' } } },
              { user: { email: { contains: filters.search, mode: 'insensitive' } } },
              { guardians: { some: { name: { contains: filters.search, mode: 'insensitive' } } } },
            ],
          }
        : {},
    ],
  }

  const orderBy: Prisma.StudentOrderByWithRelationInput =
    filters.sortBy === 'name'
      ? { user: { name: filters.sortOrder } }
      : filters.sortBy === 'admissionNo'
        ? { admissionNo: filters.sortOrder }
        : { createdAt: filters.sortOrder }

  const [rows, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      include: {
        user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
        class: { select: { name: true } },
        enrollments: {
          where: { status: 'ACTIVE' },
          take: 1,
          include: { section: { select: { name: true } } },
        },
        guardians: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.student.count({ where }),
  ])

  const items: StudentListItem[] = rows.map((s) => ({
    id: s.id,
    admissionNo: s.admissionNo,
    rollNo: s.rollNo,
    name: s.user.name,
    email: s.user.email,
    phone: s.user.phone,
    className: s.class?.name ?? null,
    sectionName: s.enrollments[0]?.section.name ?? null,
    gender: s.gender,
    status: s.status,
    avatarUrl: s.user.avatarUrl,
    parentName: s.guardians[0]?.name ?? null,
    guardianPhone: s.guardians[0]?.phone ?? null,
  }))

  return { items, meta: buildMeta(filters.page, filters.limit, total) }
}

// ─────────────────────────────────────────────────────────────
//  detail
// ─────────────────────────────────────────────────────────────

export async function getStudent(actor: Actor, id: string) {
  const scope = await scopeFor(actor)

  const student = await prisma.student.findFirst({
    where: { AND: [{ id }, scope] },
    include: {
      user: { select: { name: true, email: true, phone: true, avatarUrl: true, status: true } },
      class: { select: { id: true, name: true, level: true } },
      enrollments: {
        where: { status: 'ACTIVE' },
        include: {
          section: { select: { id: true, name: true } },
          academicYear: { select: { name: true } },
        },
      },
      guardians: true,
      attendance: { orderBy: { date: 'desc' }, take: 30, select: { date: true, status: true } },
      results: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          exam: { select: { name: true, totalMarks: true, type: true } },
          subject: { select: { name: true } },
        },
      },
      invoices: {
        orderBy: { dueDate: 'desc' },
        take: 12,
        include: { payments: true },
      },
    },
  })

  if (!student) throw notFound('Student')

  // Derived numbers so the UI never has to compute them.
  const attendanceTotal = student.attendance.length
  const present = student.attendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length

  const totalBilled = student.invoices.reduce((sum, i) => sum + Number(i.totalAmount), 0)
  const totalPaid = student.invoices.reduce((sum, i) => sum + Number(i.paidAmount), 0)

  const marks = student.results.map((r) => ({
    percent: (Number(r.marksObtained) / r.exam.totalMarks) * 100,
    marks: Number(r.marksObtained),
  }))
  const averagePercent = marks.length
    ? Math.round(marks.reduce((s, m) => s + m.percent, 0) / marks.length)
    : null

  return {
    id: student.id,
    admissionNo: student.admissionNo,
    rollNo: student.rollNo,
    name: student.user.name,
    email: student.user.email,
    phone: student.user.phone,
    avatarUrl: student.user.avatarUrl,
    accountStatus: student.user.status,
    gender: student.gender,
    dateOfBirth: student.dateOfBirth,
    bloodGroup: student.bloodGroup,
    address: student.address,
    city: student.city,
    admissionDate: student.admissionDate,
    status: student.status,
    class: student.class,
    section: student.enrollments[0]?.section ?? null,
    academicYear: student.enrollments[0]?.academicYear.name ?? null,
    guardians: student.guardians,
    attendance: {
      sampleDays: attendanceTotal,
      presentDays: present,
      rate: attendanceTotal ? Math.round((present / attendanceTotal) * 100) : null,
      recent: student.attendance.slice(0, 10),
    },
    results: student.results.map((r) => ({
      id: r.id,
      exam: r.exam.name,
      type: r.exam.type,
      subject: r.subject.name,
      marks: Number(r.marksObtained),
      totalMarks: r.exam.totalMarks,
      grade: r.grade,
      date: r.createdAt,
    })),
    averagePercent,
    fees: {
      totalBilled,
      totalPaid,
      outstanding: totalBilled - totalPaid,
      invoices: student.invoices.map((i) => ({
        id: i.id,
        invoiceNo: i.invoiceNo,
        title: i.title,
        amount: Number(i.totalAmount),
        paid: Number(i.paidAmount),
        dueDate: i.dueDate,
        status: i.status,
      })),
    },
  }
}

// ─────────────────────────────────────────────────────────────
//  create
// ─────────────────────────────────────────────────────────────

export interface CreateStudentInput {
  name: string
  email: string
  phone?: string | null
  dateOfBirth: string
  gender: 'MALE' | 'FEMALE' | 'OTHER'
  bloodGroup?: string | null
  address?: string | null
  city?: string | null
  admissionDate?: string
  classId?: string | null
  sectionId?: string | null
  rollNo?: string | null
  photoUrl?: string | null
  guardian: {
    name: string
    relation: string
    phone: string
    email?: string | null
    cnic?: string | null
    occupation?: string | null
  }
  /** Optional — generated and returned once when omitted. */
  password?: string
}

/** ADM-2026-0001 — next number for the current year. */
async function nextAdmissionNo(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ADM-${year}-`
  const last = await prisma.student.findFirst({
    where: { admissionNo: { startsWith: prefix } },
    orderBy: { admissionNo: 'desc' },
    select: { admissionNo: true },
  })
  const lastNumber = last ? Number(last.admissionNo.slice(prefix.length)) : 0
  return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`
}

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  return `${pick(upper)}${pick(lower)}${pick(lower)}${pick(lower)}${pick(digits)}${pick(digits)}${pick(digits)}${pick(digits)}`
}

export async function createStudent(actor: Actor, input: CreateStudentInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can enrol students')

  const email = input.email.toLowerCase().trim()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw conflict(`An account with ${email} already exists`)

  // Resolve the class/section pair — a section implies its class.
  let classId = input.classId ?? null
  let sectionId = input.sectionId ?? null

  if (sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { classId: true },
    })
    if (!section) throw badRequest('Section not found')
    classId = section.classId
  }

  if (classId) {
    const cls = await prisma.class.findUnique({ where: { id: classId } })
    if (!cls) throw badRequest('Class not found')
  }

  const academicYear = await prisma.academicYear.findFirst({ where: { isCurrent: true } })
  if (sectionId && !academicYear) throw badRequest('No academic year is marked as current')

  const plainPassword = input.password && input.password.length >= 8 ? input.password : generateTempPassword()
  const passwordHash = await hashPassword(plainPassword)
  const admissionNo = await nextAdmissionNo()

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'STUDENT',
        name: input.name.trim(),
        phone: input.phone ?? null,
        avatarUrl: input.photoUrl ?? null,
      },
    })

    const student = await tx.student.create({
      data: {
        userId: user.id,
        admissionNo,
        rollNo: input.rollNo ?? null,
        dateOfBirth: new Date(input.dateOfBirth),
        gender: input.gender,
        bloodGroup: input.bloodGroup ?? null,
        address: input.address ?? null,
        city: input.city ?? null,
        admissionDate: input.admissionDate ? new Date(input.admissionDate) : new Date(),
        status: 'ACTIVE',
        classId,
        photoUrl: input.photoUrl ?? null,
      },
    })

    if (sectionId && classId && academicYear) {
      await tx.enrollment.create({
        data: {
          studentId: student.id,
          classId,
          sectionId,
          academicYearId: academicYear.id,
          rollNo: input.rollNo ?? null,
        },
      })
    }

    await tx.guardian.create({
      data: {
        studentId: student.id,
        name: input.guardian.name,
        relation: input.guardian.relation,
        phone: input.guardian.phone,
        email: input.guardian.email ?? null,
        cnic: input.guardian.cnic ?? null,
        occupation: input.guardian.occupation ?? null,
        isPrimary: true,
        isEmergency: true,
      },
    })

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: 'student.create',
        entity: 'Student',
        entityId: student.id,
        metadata: { admissionNo, email },
      },
    })

    return student
  })

  return {
    student: await getStudent(actor, result.id),
    // Shown once so the office can hand it to the family.
    credentials: { email, temporaryPassword: plainPassword },
  }
}

// ─────────────────────────────────────────────────────────────
//  update
// ─────────────────────────────────────────────────────────────

export interface UpdateStudentInput {
  name?: string
  phone?: string | null
  dateOfBirth?: string
  gender?: 'MALE' | 'FEMALE' | 'OTHER'
  bloodGroup?: string | null
  address?: string | null
  city?: string | null
  status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'WITHDRAWN' | 'PENDING'
  classId?: string | null
  sectionId?: string | null
  rollNo?: string | null
  photoUrl?: string | null
  guardian?: {
    id?: string
    name?: string
    relation?: string
    phone?: string
    email?: string | null
    cnic?: string | null
    occupation?: string | null
  }
}

export async function updateStudent(actor: Actor, id: string, input: UpdateStudentInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can edit student records')

  const student = await prisma.student.findUnique({ where: { id }, include: { user: true } })
  if (!student) throw notFound('Student')

  // Moving to a different section replaces the active enrollment.
  let sectionToMoveTo: { id: string; classId: string } | null = null
  if (input.sectionId) {
    const section = await prisma.section.findUnique({
      where: { id: input.sectionId },
      select: { id: true, classId: true },
    })
    if (!section) throw badRequest('Section not found')
    sectionToMoveTo = section
  }

  await prisma.$transaction(async (tx) => {
    // user-level fields
    const userData: Prisma.UserUpdateInput = {}
    if (input.name !== undefined) userData.name = input.name.trim()
    if (input.phone !== undefined) userData.phone = input.phone
    if (input.photoUrl !== undefined) userData.avatarUrl = input.photoUrl
    if (Object.keys(userData).length) {
      await tx.user.update({ where: { id: student.userId }, data: userData })
    }

    const studentData: Prisma.StudentUpdateInput = {}
    if (input.dateOfBirth !== undefined) studentData.dateOfBirth = new Date(input.dateOfBirth)
    if (input.gender !== undefined) studentData.gender = input.gender
    if (input.bloodGroup !== undefined) studentData.bloodGroup = input.bloodGroup
    if (input.address !== undefined) studentData.address = input.address
    if (input.city !== undefined) studentData.city = input.city
    if (input.status !== undefined) studentData.status = input.status
    if (input.rollNo !== undefined) studentData.rollNo = input.rollNo
    if (input.photoUrl !== undefined) studentData.photoUrl = input.photoUrl
    if (sectionToMoveTo) {
      studentData.class = { connect: { id: sectionToMoveTo.classId } }
    } else if (input.classId !== undefined) {
      studentData.class = input.classId ? { connect: { id: input.classId } } : { disconnect: true }
    }
    if (Object.keys(studentData).length) {
      await tx.student.update({ where: { id }, data: studentData })
    }

    // re-enroll when the section changes
    if (sectionToMoveTo) {
      const academicYear = await tx.academicYear.findFirst({ where: { isCurrent: true } })
      if (academicYear) {
        await tx.enrollment.updateMany({
          where: { studentId: id, status: 'ACTIVE' },
          data: { status: 'TRANSFERRED' },
        })
        await tx.enrollment.create({
          data: {
            studentId: id,
            classId: sectionToMoveTo.classId,
            sectionId: sectionToMoveTo.id,
            academicYearId: academicYear.id,
            rollNo: input.rollNo ?? student.rollNo,
          },
        })
      }
    }

    // guardian: update the primary one
    if (input.guardian) {
      const primary = await tx.guardian.findFirst({ where: { studentId: id, isPrimary: true } })
      const g = input.guardian
      if (primary) {
        await tx.guardian.update({
          where: { id: primary.id },
          data: {
            ...(g.name !== undefined ? { name: g.name } : {}),
            ...(g.relation !== undefined ? { relation: g.relation } : {}),
            ...(g.phone !== undefined ? { phone: g.phone } : {}),
            ...(g.email !== undefined ? { email: g.email } : {}),
            ...(g.cnic !== undefined ? { cnic: g.cnic } : {}),
            ...(g.occupation !== undefined ? { occupation: g.occupation } : {}),
          },
        })
      } else if (g.name && g.relation && g.phone) {
        await tx.guardian.create({
          data: {
            studentId: id,
            name: g.name,
            relation: g.relation,
            phone: g.phone,
            email: g.email ?? null,
            cnic: g.cnic ?? null,
            occupation: g.occupation ?? null,
            isPrimary: true,
          },
        })
      }
    }

    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: 'student.update',
        entity: 'Student',
        entityId: id,
        metadata: { fields: Object.keys(input) },
      },
    })
  })

  return getStudent(actor, id)
}

// ─────────────────────────────────────────────────────────────
//  delete / status change
// ─────────────────────────────────────────────────────────────

/**
 * Students are never hard-deleted: attendance, marks and invoices are
 * financial/academic records. `hard=true` exists for genuine mistakes only.
 */
export async function deleteStudent(actor: Actor, id: string, hard = false) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can remove students')

  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) throw notFound('Student')

  if (hard) {
    // Cascades remove the student's user account and dependent rows.
    await prisma.student.delete({ where: { id } })
    await prisma.user.delete({ where: { id: student.userId } }).catch(() => undefined)
    await prisma.auditLog.create({
      data: { userId: actor.id, action: 'student.delete_hard', entity: 'Student', entityId: id },
    })
    return { deleted: true }
  }

  await prisma.$transaction([
    prisma.student.update({ where: { id }, data: { status: 'WITHDRAWN' } }),
    prisma.user.update({ where: { id: student.userId }, data: { status: 'INACTIVE' } }),
    prisma.enrollment.updateMany({ where: { studentId: id, status: 'ACTIVE' }, data: { status: 'WITHDRAWN' } }),
    prisma.auditLog.create({
      data: { userId: actor.id, action: 'student.withdraw', entity: 'Student', entityId: id },
    }),
  ])

  return { deleted: false, status: 'WITHDRAWN' }
}

// ─────────────────────────────────────────────────────────────
//  CSV export
// ─────────────────────────────────────────────────────────────

export async function exportStudentsCsv(actor: Actor, filters: StudentListFilters): Promise<string> {
  const { items } = await listStudents(actor, { ...filters, page: 1, limit: 100 })

  const headers = [
    'Admission No',
    'Roll No',
    'Name',
    'Email',
    'Phone',
    'Class',
    'Section',
    'Gender',
    'Status',
    'Guardian',
    'Guardian Phone',
  ]

  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`

  const rows = items.map((s) =>
    [s.admissionNo, s.rollNo, s.name, s.email, s.phone, s.className, s.sectionName, s.gender, s.status, s.parentName, s.guardianPhone]
      .map(escape)
      .join(','),
  )

  return [headers.map(escape).join(','), ...rows].join('\n')
}

// ─────────────────────────────────────────────────────────────
//  BULK IMPORT
// ─────────────────────────────────────────────────────────────

/** Columns a bulk-import CSV must carry. Everything else is optional. */
export const IMPORT_COLUMNS = [
  'name',
  'email',
  'date_of_birth',
  'gender',
  'guardian_name',
  'guardian_relation',
  'guardian_phone',
] as const

export interface ImportRowError {
  row: number
  email: string
  message: string
}

export interface ImportReport {
  dryRun: boolean
  total: number
  imported: number
  skipped: number
  errors: ImportRowError[]
  /** Only in dry-run mode: one sample of the credentials that would be issued. */
  sample?: { name: string; email: string; temporaryPassword: string }
}

const GENDER_ALIASES: Record<string, 'MALE' | 'FEMALE' | 'OTHER'> = {
  m: 'MALE',
  male: 'MALE',
  boy: 'MALE',
  f: 'FEMALE',
  female: 'FEMALE',
  girl: 'FEMALE',
  o: 'OTHER',
  other: 'OTHER',
}

function normaliseDate(value: string): string | null {
  if (!value) return null
  // Accept 2010-05-12, 12/05/2010 and 12-05-2010; ambiguity is resolved to
  // day-first because the schools using this are in Pakistan.
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (iso) return value

  const dmy = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(value)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${m!.padStart(2, '0')}-${d!.padStart(2, '0')}`
  }
  return null
}

/**
 * Imports learners from a CSV.
 *
 * `dryRun` validates every row and reports what *would* happen without writing
 * anything. That is the default in the UI, because a 400-row import that fails
 * halfway is far worse than one that never started.
 *
 * Each row is created through the same `createStudent` path as the single-entry
 * form, so admission numbers, guardian linking and temp passwords behave
 * identically — no second implementation to drift.
 */
export async function importStudents(
  actor: Actor,
  csvText: string,
  options: { dryRun: boolean; defaultPassword?: string },
): Promise<ImportReport> {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can import students')

  const { headers, rows } = parseCsvTable(csvText)

  const missing = IMPORT_COLUMNS.filter((column) => !headers.includes(column))
  if (missing.length > 0) {
    throw badRequest(`The CSV is missing required column(s): ${missing.join(', ')}`)
  }

  const errors: ImportRowError[] = []
  const seenEmails = new Set<string>()
  let imported = 0
  let sample: ImportReport['sample']

  for (const [index, row] of rows.entries()) {
    // Row 1 is the header, so the human-readable number is index + 2.
    const rowNumber = index + 2
    const email = (row.email ?? '').toLowerCase()

    const fail = (message: string) => {
      errors.push({ row: rowNumber, email: email || '(blank)', message })
    }

    if (!email) {
      fail('Email is required')
      continue
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fail('Email is not valid')
      continue
    }
    // First occurrence wins; later ones are the duplicates. Registration order is
    // the only sensible tie-break when a file repeats an address.
    if (seenEmails.has(email)) {
      fail('Duplicate email inside this file')
      continue
    }
    seenEmails.add(email)

    if ((row.name ?? '').length < 2) {
      fail('Name is required')
      continue
    }

    const dob = normaliseDate(row.date_of_birth ?? '')
    if (!dob) {
      fail('Date of birth must be YYYY-MM-DD or DD/MM/YYYY')
      continue
    }
    if (new Date(dob) >= new Date()) {
      fail('Date of birth must be in the past')
      continue
    }

    const gender = GENDER_ALIASES[(row.gender ?? '').toLowerCase()]
    if (!gender) {
      fail('Gender must be MALE, FEMALE or OTHER')
      continue
    }

    if ((row.guardian_name ?? '').length < 2) {
      fail('Guardian name is required')
      continue
    }
    if ((row.guardian_phone ?? '').replace(/\D/g, '').length < 7) {
      fail('Guardian phone is required')
      continue
    }

    const payload = {
      name: row.name!.trim(),
      email,
      dateOfBirth: dob,
      gender,
      phone: row.phone || null,
      city: row.city || null,
      address: row.address || null,
      guardian: {
        name: row.guardian_name!.trim(),
        relation: row.guardian_relation?.trim() || 'Guardian',
        phone: row.guardian_phone!.trim(),
        email: row.guardian_email?.trim() || null,
      },
      password: options.defaultPassword,
    }

    if (options.dryRun) {
      // An existing account is the most common real-world conflict, so it is
      // checked here too — otherwise a dry run would look clean then fail.
      const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
      if (existing) {
        fail('An account with this email already exists')
        continue
      }
      imported += 1
      continue
    }

    try {
      const result = await createStudent(actor, payload as Parameters<typeof createStudent>[1])
      imported += 1
      if (!sample) sample = { name: payload.name, ...result.credentials }
    } catch (error) {
      fail(error instanceof Error ? error.message : 'Could not import this row')
    }
  }

  return {
    dryRun: options.dryRun,
    total: rows.length,
    imported,
    skipped: errors.length,
    errors,
    ...(options.dryRun && sample ? { sample } : {}),
  }
}
