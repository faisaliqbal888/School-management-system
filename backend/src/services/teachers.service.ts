import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, conflict, forbidden, notFound } from '../utils/errors.js'
import { hashPassword } from '../utils/password.js'
import { buildMeta, type PaginationMeta } from '../utils/response.js'
import type { PaginationQuery } from '../utils/pagination.js'

/**
 * Teachers module.
 *
 * Access rules:
 *   ADMIN    — full CRUD
 *   TEACHER  — read their own profile; read the staff directory (basic fields)
 *   STUDENT / PARENT — read basic directory info only (name, department, subjects)
 */

export interface Actor {
  id: string
  role: Role
}

// ─────────────────────────────────────────────────────────────
//  list
// ─────────────────────────────────────────────────────────────

export interface TeacherListFilters extends PaginationQuery {
  department?: string
  status?: string
  employmentType?: string
}

export interface TeacherListItem {
  id: string
  employeeNo: string
  name: string
  email: string
  phone: string | null
  avatarUrl: string | null
  department: string
  designation: string
  qualification: string | null
  specialization: string | null
  employmentType: string
  status: string
  joiningDate: string
  baseSalary: number
  subjects: string[]
  classTeacherOf: string | null
  sectionCount: number
  studentCount: number
}

const LIST_SELECT = {
  id: true,
  employeeNo: true,
  department: true,
  designation: true,
  qualification: true,
  specialization: true,
  employmentType: true,
  status: true,
  joiningDate: true,
  baseSalary: true,
  user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
  subjects: { select: { subject: { select: { name: true } } } },
  classAsTeacher: { select: { name: true } },
  timetable: { select: { sectionId: true } },
  assignments: { select: { sectionId: true } },
} satisfies Prisma.TeacherSelect

export async function listTeachers(
  actor: Actor,
  filters: TeacherListFilters,
): Promise<{ items: TeacherListItem[]; meta: PaginationMeta }> {
  const where: Prisma.TeacherWhereInput = {
    ...(filters.department ? { department: filters.department } : {}),
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.employmentType ? { employmentType: filters.employmentType as never } : {}),
    ...(filters.search
      ? {
          OR: [
            { user: { name: { contains: filters.search, mode: 'insensitive' } } },
            { user: { email: { contains: filters.search, mode: 'insensitive' } } },
            { employeeNo: { contains: filters.search, mode: 'insensitive' } },
            { department: { contains: filters.search, mode: 'insensitive' } },
            { specialization: { contains: filters.search, mode: 'insensitive' } },
            { designation: { contains: filters.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  }

  const staffView = actor.role === 'STUDENT' || actor.role === 'PARENT'

  const orderBy: Prisma.TeacherOrderByWithRelationInput =
    filters.sortBy === 'name'
      ? { user: { name: filters.sortOrder } }
      : filters.sortBy === 'employeeNo'
        ? { employeeNo: filters.sortOrder }
        : filters.sortBy === 'joiningDate'
          ? { joiningDate: filters.sortOrder }
          : { createdAt: filters.sortOrder }

  const [rows, total] = await prisma.$transaction([
    prisma.teacher.findMany({
      where,
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: LIST_SELECT,
    }),
    prisma.teacher.count({ where }),
  ])

  // Distinct sections a teacher covers, and how many students sit in them.
  const teacherIds = rows.map((r) => r.id)
  const sectionIdsByTeacher = new Map<string, Set<string>>()
  for (const row of rows) {
    const ids = new Set(
      [...row.timetable.map((t) => t.sectionId), ...row.assignments.map((a) => a.sectionId)].filter(
        (s): s is string => !!s,
      ),
    )
    sectionIdsByTeacher.set(row.id, ids)
  }
  const allSectionIds = [...new Set([...sectionIdsByTeacher.values()].flatMap((s) => [...s]))]
  const enrollments = allSectionIds.length
    ? await prisma.enrollment.findMany({
        where: { sectionId: { in: allSectionIds }, status: 'ACTIVE' },
        select: { sectionId: true },
      })
    : []
  const studentsBySection = new Map<string, number>()
  for (const e of enrollments) {
    if (!e.sectionId) continue
    studentsBySection.set(e.sectionId, (studentsBySection.get(e.sectionId) ?? 0) + 1)
  }

  const items: TeacherListItem[] = rows.map((t) => {
    const sectionIds = sectionIdsByTeacher.get(t.id) ?? new Set<string>()
    const studentCount = [...sectionIds].reduce(
      (sum, sid) => sum + (studentsBySection.get(sid) ?? 0),
      0,
    )
    return {
      id: t.id,
      employeeNo: t.employeeNo,
      name: t.user.name,
      email: staffView ? '' : t.user.email,
      phone: staffView ? null : t.user.phone,
      avatarUrl: t.user.avatarUrl,
      department: t.department,
      designation: t.designation,
      qualification: t.qualification,
      specialization: t.specialization,
      employmentType: t.employmentType,
      status: t.status,
      joiningDate: t.joiningDate.toISOString(),
      baseSalary: staffView ? 0 : Number(t.baseSalary),
      subjects: t.subjects.map((s) => s.subject.name),
      classTeacherOf: t.classAsTeacher?.name ?? null,
      sectionCount: sectionIds.size,
      studentCount,
    }
  })

  // silence "unused" — teacherIds kept for potential follow-up joins
  void teacherIds

  return { items, meta: buildMeta(filters.page, filters.limit, total) }
}

// ─────────────────────────────────────────────────────────────
//  detail
// ─────────────────────────────────────────────────────────────

export interface TeacherDetail extends TeacherListItem {
  dob: string | null
  address: string | null
  city: string | null
  classes: { id: string; name: string; level: number; section: string | null }[]
  subjectAssignments: { id: string; subject: string; className: string; sectionName: string | null }[]
  timetableLoad: number
  payrollLatest: { period: string; net: number; status: string } | null
  leaveRequests: { id: string; from: string; to: string; status: string; reason: string }[]
}

export async function getTeacher(actor: Actor, id: string): Promise<TeacherDetail> {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    select: {
      ...LIST_SELECT,
      user: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
      subjects: { select: { subject: { select: { name: true } } } },
      timetable: { select: { sectionId: true } },
      assignments: {
        select: { id: true, subjectId: true, sectionId: true, subject: { select: { name: true } } },
      },
      payroll: { orderBy: { period: 'desc' }, take: 1, select: { period: true, netPay: true, status: true } },
      leaveRequests: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, fromDate: true, toDate: true, status: true, reason: true },
      },
    },
  })

  if (!teacher) throw notFound('Teacher')

  // A teacher may always read their own record.
  if (actor.role === 'TEACHER') {
    const own = await prisma.teacher.findUnique({ where: { userId: actor.id }, select: { id: true } })
    if (!own || own.id !== teacher.id) throw forbidden('You can only view your own profile')
  }

  // Sections this teacher covers = timetable slots ∪ subject assignments.
  const sectionIds = [
    ...new Set([
      ...teacher.timetable.map((t) => t.sectionId),
      ...teacher.assignments.map((a) => a.sectionId),
    ]),
  ].filter((s): s is string => !!s)
  const enrollments = sectionIds.length
    ? await prisma.enrollment.findMany({
        where: { sectionId: { in: sectionIds }, status: 'ACTIVE' },
        select: { sectionId: true },
      })
    : []
  const studentsBySection = new Map<string, number>()
  for (const e of enrollments) {
    if (!e.sectionId) continue
    studentsBySection.set(e.sectionId, (studentsBySection.get(e.sectionId) ?? 0) + 1)
  }
  const studentCount = [...sectionIds].reduce(
    (sum, sid) => sum + (studentsBySection.get(sid) ?? 0),
    0,
  )

  const classes = await prisma.section.findMany({
    where: { id: { in: sectionIds } },
    select: { id: true, name: true, class: { select: { id: true, name: true, level: true } } },
    orderBy: { class: { level: 'desc' } },
  })
  const sectionNames = new Map(classes.map((c) => [c.id, { section: c.name, className: c.class.name }]))

  const latest = teacher.payroll[0]

  return {
    id: teacher.id,
    employeeNo: teacher.employeeNo,
    name: teacher.user.name,
    email: teacher.user.email,
    phone: teacher.user.phone,
    avatarUrl: teacher.user.avatarUrl,
    department: teacher.department,
    designation: teacher.designation,
    qualification: teacher.qualification,
    specialization: teacher.specialization,
    employmentType: teacher.employmentType,
    status: teacher.status,
    joiningDate: teacher.joiningDate.toISOString(),
    baseSalary: Number(teacher.baseSalary),
    subjects: teacher.subjects.map((s) => s.subject.name),
    classTeacherOf: teacher.classAsTeacher?.name ?? null,
    sectionCount: sectionIds.length,
    studentCount,
    dob: null,
    address: null,
    city: null,
    classes: classes.map((c) => ({
      id: c.class.id,
      name: c.class.name,
      level: c.class.level,
      section: c.name,
    })),
    subjectAssignments: teacher.assignments.map((a) => ({
      id: a.id,
      subject: a.subject.name,
      className: sectionNames.get(a.sectionId)?.className ?? '—',
      sectionName: sectionNames.get(a.sectionId)?.section ?? null,
    })),
    timetableLoad: teacher.timetable.length,
    payrollLatest: latest
      ? { period: latest.period, net: Number(latest.netPay), status: latest.status }
      : null,
    leaveRequests: teacher.leaveRequests.map((l) => ({
      id: l.id,
      from: l.fromDate.toISOString(),
      to: l.toDate.toISOString(),
      status: l.status,
      reason: l.reason,
    })),
  }
}

// ─────────────────────────────────────────────────────────────
//  create / update / delete
// ─────────────────────────────────────────────────────────────

export interface CreateTeacherInput {
  name: string
  email: string
  phone?: string | null
  dob?: string | null
  address?: string | null
  city?: string | null
  department: string
  designation: string
  qualification?: string | null
  specialization?: string | null
  joiningDate: string
  employmentType?: 'PERMANENT' | 'CONTRACT' | 'PART_TIME' | 'VISITING'
  baseSalary: number
  subjectIds?: string[]
  password?: string
}

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)]
  return `${pick(upper)}${pick(lower)}${pick(lower)}${pick(lower)}${pick(digits)}${pick(digits)}${pick(digits)}${pick(digits)}`
}

async function nextEmployeeNo(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `EMP-${year}-`
  const last = await prisma.teacher.findFirst({
    where: { employeeNo: { startsWith: prefix } },
    orderBy: { employeeNo: 'desc' },
    select: { employeeNo: true },
  })
  const next = last ? Number(last.employeeNo.slice(prefix.length)) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

export async function createTeacher(actor: Actor, input: CreateTeacherInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can add teachers')

  const email = input.email.toLowerCase().trim()
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) throw conflict('A user with this email already exists')

  const plainPassword =
    input.password && input.password.length >= 8 ? input.password : generateTempPassword()
  const passwordHash = await hashPassword(plainPassword)
  const employeeNo = await nextEmployeeNo()

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        role: 'TEACHER',
        name: input.name.trim(),
        phone: input.phone ?? null,
      },
    })

    const teacher = await tx.teacher.create({
      data: {
        userId: user.id,
        employeeNo,
        department: input.department.trim(),
        designation: input.designation.trim(),
        qualification: input.qualification ?? null,
        specialization: input.specialization ?? null,
        joiningDate: new Date(input.joiningDate),
        employmentType: input.employmentType ?? 'PERMANENT',
        baseSalary: new Prisma.Decimal(input.baseSalary),
        status: 'ACTIVE',
      },
    })

    if (input.subjectIds?.length) {
      await tx.teacherSubject.createMany({
        data: input.subjectIds.map((subjectId) => ({ teacherId: teacher.id, subjectId })),
        skipDuplicates: true,
      })
    }

    return teacher
  })

  return {
    teacher: await getTeacher(actor, result.id),
    credentials: { email: input.email.toLowerCase().trim(), temporaryPassword: plainPassword },
  }
}

export interface UpdateTeacherInput {
  name?: string
  phone?: string | null
  dob?: string | null
  address?: string | null
  city?: string | null
  department?: string
  designation?: string
  qualification?: string | null
  specialization?: string | null
  joiningDate?: string
  employmentType?: 'PERMANENT' | 'CONTRACT' | 'PART_TIME' | 'VISITING'
  baseSalary?: number
  status?: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'TERMINATED'
  subjectIds?: string[]
}

export async function updateTeacher(actor: Actor, id: string, input: UpdateTeacherInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can edit teacher records')

  const teacher = await prisma.teacher.findUnique({ where: { id }, select: { userId: true } })
  if (!teacher) throw notFound('Teacher')

  await prisma.$transaction(async (tx) => {
    const userData: Prisma.UserUpdateInput = {}
    if (input.name !== undefined) userData.name = input.name.trim()
    if (input.phone !== undefined) userData.phone = input.phone
    if (Object.keys(userData).length) {
      await tx.user.update({ where: { id: teacher.userId }, data: userData })
    }

    const data: Prisma.TeacherUpdateInput = {}
    if (input.department !== undefined) data.department = input.department.trim()
    if (input.designation !== undefined) data.designation = input.designation.trim()
    if (input.qualification !== undefined) data.qualification = input.qualification
    if (input.specialization !== undefined) data.specialization = input.specialization
    if (input.joiningDate !== undefined) data.joiningDate = new Date(input.joiningDate)
    if (input.employmentType !== undefined) data.employmentType = input.employmentType
    if (input.baseSalary !== undefined) data.baseSalary = new Prisma.Decimal(input.baseSalary)
    if (input.status !== undefined) data.status = input.status
    if (Object.keys(data).length) {
      await tx.teacher.update({ where: { id }, data })
    }

    if (input.subjectIds !== undefined) {
      await tx.teacherSubject.deleteMany({ where: { teacherId: id } })
      if (input.subjectIds.length) {
        await tx.teacherSubject.createMany({
          data: input.subjectIds.map((subjectId) => ({ teacherId: id, subjectId })),
          skipDuplicates: true,
        })
      }
    }

    // Terminal statuses also deactivate the login.
    if (input.status === 'RESIGNED' || input.status === 'TERMINATED') {
      await tx.user.update({ where: { id: teacher.userId }, data: { status: 'INACTIVE' } })
    } else if (input.status === 'ACTIVE') {
      await tx.user.update({ where: { id: teacher.userId }, data: { status: 'ACTIVE' } })
    }
  })

  return getTeacher(actor, id)
}

/**
 * Soft by default: the staff record is marked TERMINATED and the login is
 * disabled, keeping history (payroll, timetable, exams) intact.
 * `hard` deletes the user, which cascades to the teacher row.
 */
export async function deleteTeacher(actor: Actor, id: string, hard = false) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can remove teachers')

  const teacher = await prisma.teacher.findUnique({ where: { id }, select: { id: true, userId: true } })
  if (!teacher) throw notFound('Teacher')

  const activeTimetable = await prisma.timetableSlot.count({ where: { teacherId: id } })

  if (hard) {
    if (activeTimetable > 0) {
      throw badRequest(
        `This teacher still has ${activeTimetable} timetable slot(s) assigned. Reassign them or use a soft delete (terminate).`,
      )
    }
    await prisma.user.delete({ where: { id: teacher.userId } })
    return { deleted: true, hard: true as const }
  }

  await prisma.$transaction([
    prisma.teacher.update({ where: { id }, data: { status: 'TERMINATED' } }),
    prisma.user.update({ where: { id: teacher.userId }, data: { status: 'INACTIVE' } }),
  ])

  return { deleted: true, status: 'TERMINATED' as const, timetableSlots: activeTimetable }
}

// ─────────────────────────────────────────────────────────────
//  helpers for the UI
// ─────────────────────────────────────────────────────────────

export async function getTeacherFilters() {
  const [departments, designations] = await prisma.$transaction([
    prisma.teacher.findMany({ select: { department: true }, distinct: ['department'], orderBy: { department: 'asc' } }),
    prisma.teacher.findMany({ select: { designation: true }, distinct: ['designation'], orderBy: { designation: 'asc' } }),
  ])

  return {
    departments: departments.map((d) => d.department),
    designations: designations.map((d) => d.designation),
    subjects: await prisma.subject.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: 'asc' },
    }),
  }
}

export async function exportTeachersCsv(actor: Actor, filters: TeacherListFilters): Promise<string> {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can export teacher data')

  const { items } = await listTeachers(actor, { ...filters, page: 1, limit: 100 })

  const header = [
    'Employee No',
    'Name',
    'Email',
    'Phone',
    'Department',
    'Designation',
    'Qualification',
    'Specialization',
    'Employment Type',
    'Status',
    'Joining Date',
    'Base Salary (PKR)',
    'Subjects',
    'Class Teacher Of',
    'Sections',
    'Students',
  ]

  const escape = (value: unknown): string => {
    const s = String(value ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  const lines = [header.join(',')]
  for (const t of items) {
    lines.push(
      [
        t.employeeNo,
        t.name,
        t.email,
        t.phone ?? '',
        t.department,
        t.designation,
        t.qualification ?? '',
        t.specialization ?? '',
        t.employmentType,
        t.status,
        t.joiningDate.slice(0, 10),
        t.baseSalary,
        t.subjects.join(' | '),
        t.classTeacherOf ?? '',
        t.sectionCount,
        t.studentCount,
      ]
        .map(escape)
        .join(','),
    )
  }

  return lines.join('\n')
}
