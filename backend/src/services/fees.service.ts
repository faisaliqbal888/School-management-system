import { Prisma, type Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { badRequest, forbidden, notFound } from '../utils/errors.js'
import type { PaginationQuery } from '../utils/pagination.js'
import { buildMeta, type PaginationMeta } from '../utils/response.js'

/**
 * Fees module — fee structures, invoices, payments.
 *
 * Access rules:
 *   ADMIN    — full control: structures, invoices, payments, waivers
 *   TEACHER  — read-only aggregates (no learner financial data)
 *   STUDENT  — own invoices + payments
 *   PARENT   — their children's invoices + payments
 */

export interface Actor {
  id: string
  role: Role
}

function money(value: Prisma.Decimal | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  return Number(value)
}

function dayStart(input: string | Date): Date {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) throw badRequest('Invalid date')
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/** Invoices past their due date become OVERDUE on read. */
async function refreshOverdue(): Promise<void> {
  const today = dayStart(new Date())
  await prisma.invoice.updateMany({
    where: { status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: today } },
    data: { status: 'OVERDUE' },
  })
}

/** Invoice ids the actor may see, or null for "all" (admin). */
async function scopeStudentIds(actor: Actor): Promise<Prisma.InvoiceWhereInput> {
  if (actor.role === 'ADMIN') return {}
  if (actor.role === 'STUDENT') return { student: { userId: actor.id } }
  if (actor.role === 'PARENT') {
    return { student: { guardians: { some: { parent: { userId: actor.id } } } } }
  }
  // TEACHER — no access to individual learner finances
  return { id: '__none__' }
}

// ─────────────────────────────────────────────────────────────
//  fee structures
// ─────────────────────────────────────────────────────────────

export interface FeeStructureRow {
  id: string
  name: string
  classId: string
  className: string
  subjectName: string | null
  amount: number
  frequency: string
  dueDay: number
  isActive: boolean
  invoiceCount: number
}

export async function listFeeStructures(actor: Actor): Promise<FeeStructureRow[]> {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can manage fee structures')

  const rows = await prisma.feeStructure.findMany({
    orderBy: [{ class: { level: 'desc' } }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      classId: true,
      amount: true,
      frequency: true,
      dueDay: true,
      isActive: true,
      class: { select: { name: true } },
      subject: { select: { name: true } },
      _count: { select: { invoices: true } },
    },
  })

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    classId: r.classId,
    className: r.class.name,
    subjectName: r.subject?.name ?? null,
    amount: money(r.amount),
    frequency: r.frequency,
    dueDay: r.dueDay,
    isActive: r.isActive,
    invoiceCount: r._count.invoices,
  }))
}

export interface CreateFeeStructureInput {
  name: string
  classId: string
  subjectId?: string | null
  amount: number
  frequency?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME'
  dueDay?: number
}

export async function createFeeStructure(actor: Actor, input: CreateFeeStructureInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can create fee structures')

  const cls = await prisma.class.findUnique({ where: { id: input.classId }, select: { id: true } })
  if (!cls) throw badRequest('Class not found')

  const created = await prisma.feeStructure.create({
    data: {
      name: input.name.trim(),
      classId: input.classId,
      subjectId: input.subjectId ?? null,
      amount: new Prisma.Decimal(input.amount),
      frequency: input.frequency ?? 'MONTHLY',
      dueDay: input.dueDay ?? 10,
    },
  })

  return { id: created.id, name: created.name, amount: money(created.amount) }
}

// ─────────────────────────────────────────────────────────────
//  invoices
// ─────────────────────────────────────────────────────────────

export interface InvoiceFilters extends PaginationQuery {
  status?: string
  studentId?: string
  classId?: string
  period?: string
}

export interface InvoiceRow {
  id: string
  invoiceNo: string
  title: string
  period: string | null
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  sectionName: string | null
  amount: number
  discount: number
  fine: number
  totalAmount: number
  paidAmount: number
  balance: number
  dueDate: string
  status: string
  paymentsCount: number
}

export async function listInvoices(
  actor: Actor,
  filters: InvoiceFilters,
): Promise<{ items: InvoiceRow[]; meta: PaginationMeta; totals: { billed: number; paid: number; outstanding: number } }> {
  await refreshOverdue()

  const scope = await scopeStudentIds(actor)
  if (actor.role === 'TEACHER') throw forbidden('Teachers cannot view learner financial records')

  const where: Prisma.InvoiceWhereInput = {
    ...scope,
    ...(filters.status ? { status: filters.status as never } : {}),
    ...(filters.period ? { period: filters.period } : {}),
    ...(filters.classId ? { student: { ...(scope.student as object), classId: filters.classId } } : {}),
    ...(filters.studentId ? { studentId: filters.studentId } : {}),
  }

  if (filters.search) {
    where.OR = [
      { invoiceNo: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
      { student: { user: { name: { contains: filters.search, mode: 'insensitive' } } } },
      { student: { admissionNo: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  const [rows, total, aggregate] = await prisma.$transaction([
    prisma.invoice.findMany({
      where,
      orderBy: [{ dueDate: 'desc' }],
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        invoiceNo: true,
        title: true,
        period: true,
        amount: true,
        discount: true,
        fine: true,
        totalAmount: true,
        paidAmount: true,
        dueDate: true,
        status: true,
        student: {
          select: {
            id: true,
            admissionNo: true,
            user: { select: { name: true } },
            class: { select: { name: true } },
            enrollments: {
              where: { status: 'ACTIVE' },
              take: 1,
              select: { rollNo: true, section: { select: { name: true } } },
            },
          },
        },
        _count: { select: { payments: true } },
      },
    }),
    prisma.invoice.count({ where }),
    prisma.invoice.aggregate({
      where,
      _sum: { totalAmount: true, paidAmount: true },
    }),
  ])

  const billed = money(aggregate._sum.totalAmount)
  const paid = money(aggregate._sum.paidAmount)

  return {
    items: rows.map((r) => ({
      id: r.id,
      invoiceNo: r.invoiceNo,
      title: r.title,
      period: r.period,
      studentId: r.student.id,
      studentName: r.student.user.name,
      admissionNo: r.student.admissionNo,
      className: r.student.class?.name ?? '—',
      sectionName: r.student.enrollments[0]?.section?.name ?? null,
      amount: money(r.amount),
      discount: money(r.discount),
      fine: money(r.fine),
      totalAmount: money(r.totalAmount),
      paidAmount: money(r.paidAmount),
      balance: money(r.totalAmount) - money(r.paidAmount),
      dueDate: r.dueDate.toISOString(),
      status: r.status,
      paymentsCount: r._count.payments,
    })),
    meta: buildMeta(filters.page, filters.limit, total),
    totals: { billed, paid, outstanding: billed - paid },
  }
}

export interface InvoiceDetail extends InvoiceRow {
  notes: string | null
  createdAt: string
  payments: {
    id: string
    receiptNo: string
    amount: number
    method: string
    paidAt: string
    reference: string | null
    notes: string | null
  }[]
}

export async function getInvoice(actor: Actor, id: string): Promise<InvoiceDetail> {
  await refreshOverdue()
  const scope = await scopeStudentIds(actor)
  if (actor.role === 'TEACHER') throw forbidden('Teachers cannot view learner financial records')

  const invoice = await prisma.invoice.findFirst({
    where: { id, ...scope },
    select: {
      id: true,
      invoiceNo: true,
      title: true,
      period: true,
      amount: true,
      discount: true,
      fine: true,
      totalAmount: true,
      paidAmount: true,
      dueDate: true,
      status: true,
      notes: true,
      createdAt: true,
      student: {
        select: {
          id: true,
          admissionNo: true,
          user: { select: { name: true } },
          class: { select: { name: true } },
          enrollments: { where: { status: 'ACTIVE' }, take: 1, select: { section: { select: { name: true } } } },
        },
      },
      payments: {
        orderBy: { paidAt: 'desc' },
        select: { id: true, receiptNo: true, amount: true, method: true, paidAt: true, reference: true, notes: true },
      },
    },
  })

  if (!invoice) throw notFound('Invoice')

  return {
    id: invoice.id,
    invoiceNo: invoice.invoiceNo,
    title: invoice.title,
    period: invoice.period,
    studentId: invoice.student.id,
    studentName: invoice.student.user.name,
    admissionNo: invoice.student.admissionNo,
    className: invoice.student.class?.name ?? '—',
    sectionName: invoice.student.enrollments[0]?.section?.name ?? null,
    amount: money(invoice.amount),
    discount: money(invoice.discount),
    fine: money(invoice.fine),
    totalAmount: money(invoice.totalAmount),
    paidAmount: money(invoice.paidAmount),
    balance: money(invoice.totalAmount) - money(invoice.paidAmount),
    dueDate: invoice.dueDate.toISOString(),
    status: invoice.status,
    paymentsCount: invoice.payments.length,
    notes: invoice.notes,
    createdAt: invoice.createdAt.toISOString(),
    payments: invoice.payments.map((p) => ({
      id: p.id,
      receiptNo: p.receiptNo,
      amount: money(p.amount),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      reference: p.reference,
      notes: p.notes,
    })),
  }
}

async function nextSequence(prefix: string, model: 'invoice' | 'payment'): Promise<string> {
  const year = new Date().getFullYear()
  const base = `${prefix}-${year}-`

  const last =
    model === 'invoice'
      ? await prisma.invoice.findFirst({
          where: { invoiceNo: { startsWith: base } },
          orderBy: { invoiceNo: 'desc' },
          select: { invoiceNo: true },
        })
      : await prisma.payment.findFirst({
          where: { receiptNo: { startsWith: base } },
          orderBy: { receiptNo: 'desc' },
          select: { receiptNo: true },
        })

  const lastNo = last ? Number((model === 'invoice' ? (last as { invoiceNo: string }).invoiceNo : (last as { receiptNo: string }).receiptNo).slice(base.length)) : 0
  return `${base}${String(lastNo + 1).padStart(4, '0')}`
}

export interface CreateInvoiceInput {
  studentId: string
  title: string
  amount: number
  discount?: number
  fine?: number
  dueDate: string
  period?: string | null
  notes?: string | null
  feeStructureId?: string | null
}

export async function createInvoice(actor: Actor, input: CreateInvoiceInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can raise invoices')

  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { id: true, classId: true, enrollments: { where: { status: 'ACTIVE' }, take: 1, select: { sectionId: true } } },
  })
  if (!student) throw badRequest('Student not found')

  const discount = input.discount ?? 0
  const fine = input.fine ?? 0
  if (discount < 0 || fine < 0) throw badRequest('Discount and fine cannot be negative')
  if (discount > input.amount) throw badRequest('Discount cannot exceed the amount')

  const invoiceNo = await nextSequence('INV', 'invoice')

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      studentId: input.studentId,
      sectionId: student.enrollments[0]?.sectionId ?? null,
      feeStructureId: input.feeStructureId ?? null,
      title: input.title.trim(),
      period: input.period ?? new Date().toISOString().slice(0, 7),
      amount: new Prisma.Decimal(input.amount),
      discount: new Prisma.Decimal(discount),
      fine: new Prisma.Decimal(fine),
      totalAmount: new Prisma.Decimal(input.amount - discount + fine),
      dueDate: dayStart(input.dueDate),
      status: 'PENDING',
      notes: input.notes ?? null,
    },
  })

  return { id: invoice.id, invoiceNo: invoice.invoiceNo, totalAmount: money(invoice.totalAmount) }
}

/** Raises one invoice per active student in a class for a monthly fee structure. */
export async function generateMonthlyInvoices(
  actor: Actor,
  input: { feeStructureId: string; period: string },
) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can generate invoices')
  if (!/^\d{4}-\d{2}$/.test(input.period)) throw badRequest('Period must be YYYY-MM')

  const structure = await prisma.feeStructure.findUnique({
    where: { id: input.feeStructureId },
    select: { id: true, name: true, classId: true, amount: true, dueDay: true, isActive: true },
  })
  if (!structure) throw notFound('Fee structure')
  if (!structure.isActive) throw badRequest('This fee structure is inactive')

  const students = await prisma.student.findMany({
    where: { classId: structure.classId, status: 'ACTIVE' },
    select: { id: true },
  })
  if (students.length === 0) throw badRequest('No active students in this class')

  const [year, month] = input.period.split('-').map(Number)
  const dueDate = new Date(Date.UTC(year!, month! - 1, structure.dueDay))

  // skip students who already have this invoice for the period
  const existing = await prisma.invoice.findMany({
    where: {
      feeStructureId: structure.id,
      period: input.period,
      studentId: { in: students.map((s) => s.id) },
    },
    select: { studentId: true },
  })
  const already = new Set(existing.map((e) => e.studentId))
  const targets = students.filter((s) => !already.has(s.id))

  if (targets.length === 0) {
    return { created: 0, skipped: already.size, period: input.period }
  }

  // sequential numbers inside one transaction
  let counter = Number(
    (await nextSequence('INV', 'invoice')).slice(`INV-${new Date().getFullYear()}-`.length),
  )

  const year2 = new Date().getFullYear()
  await prisma.$transaction(
    targets.map((s) => {
      const invoiceNo = `INV-${year2}-${String(counter++).padStart(4, '0')}`
      return prisma.invoice.create({
        data: {
          invoiceNo,
          studentId: s.id,
          feeStructureId: structure.id,
          title: `${structure.name} — ${input.period}`,
          period: input.period,
          amount: structure.amount,
          totalAmount: structure.amount,
          dueDate,
          status: 'PENDING',
        },
      })
    }),
  )

  return { created: targets.length, skipped: already.size, period: input.period }
}

// ─────────────────────────────────────────────────────────────
//  payments
// ─────────────────────────────────────────────────────────────

export interface RecordPaymentInput {
  invoiceId: string
  amount: number
  method?: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'ONLINE' | 'CHEQUE'
  reference?: string | null
  notes?: string | null
  paidAt?: string
}

export async function recordPayment(actor: Actor, input: RecordPaymentInput) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can record payments')

  const invoice = await prisma.invoice.findUnique({
    where: { id: input.invoiceId },
    select: { id: true, totalAmount: true, paidAmount: true, status: true, studentId: true },
  })
  if (!invoice) throw notFound('Invoice')
  if (invoice.status === 'CANCELLED' || invoice.status === 'WAIVED') {
    throw badRequest(`This invoice is ${invoice.status.toLowerCase()} and cannot receive payments`)
  }

  const outstanding = money(invoice.totalAmount) - money(invoice.paidAmount)
  if (outstanding <= 0) throw badRequest('This invoice is already fully paid')
  if (input.amount <= 0) throw badRequest('Payment amount must be greater than zero')
  if (input.amount > outstanding + 0.001) {
    throw badRequest(`Payment exceeds the outstanding balance of Rs ${outstanding.toLocaleString('en-PK')}`)
  }

  const receiptNo = await nextSequence('RCP', 'payment')
  const newPaid = money(invoice.paidAmount) + input.amount
  const status =
    newPaid >= money(invoice.totalAmount) - 0.001
      ? 'PAID'
      : newPaid > 0
        ? 'PARTIAL'
        : invoice.status

  const payment = await prisma.$transaction(async (tx) => {
    const p = await tx.payment.create({
      data: {
        receiptNo,
        invoiceId: input.invoiceId,
        amount: new Prisma.Decimal(input.amount),
        method: input.method ?? 'CASH',
        reference: input.reference ?? null,
        notes: input.notes ?? null,
        receivedById: actor.id,
        ...(input.paidAt ? { paidAt: new Date(input.paidAt) } : {}),
      },
    })

    await tx.invoice.update({
      where: { id: input.invoiceId },
      data: { paidAmount: new Prisma.Decimal(newPaid), status },
    })

    return p
  })

  return {
    id: payment.id,
    receiptNo: payment.receiptNo,
    invoiceId: payment.invoiceId,
    amount: money(payment.amount),
    paidAmount: newPaid,
    balance: money(invoice.totalAmount) - newPaid,
    status,
  }
}

export async function listPayments(
  actor: Actor,
  filters: PaginationQuery & { invoiceId?: string },
) {
  if (actor.role === 'TEACHER') throw forbidden('Teachers cannot view payment records')
  const scope = await scopeStudentIds(actor)

  const where: Prisma.PaymentWhereInput = {
    ...(filters.invoiceId ? { invoiceId: filters.invoiceId } : {}),
    invoice: scope,
  }

  if (filters.search) {
    where.OR = [
      { receiptNo: { contains: filters.search, mode: 'insensitive' } },
      { reference: { contains: filters.search, mode: 'insensitive' } },
      { invoice: { invoiceNo: { contains: filters.search, mode: 'insensitive' } } },
    ]
  }

  const [rows, total] = await prisma.$transaction([
    prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
      select: {
        id: true,
        receiptNo: true,
        amount: true,
        method: true,
        paidAt: true,
        reference: true,
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            title: true,
            student: {
              select: { id: true, admissionNo: true, user: { select: { name: true } } },
            },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ])

  return {
    items: rows.map((p) => ({
      id: p.id,
      receiptNo: p.receiptNo,
      amount: money(p.amount),
      method: p.method,
      paidAt: p.paidAt.toISOString(),
      reference: p.reference,
      invoiceId: p.invoice.id,
      invoiceNo: p.invoice.invoiceNo,
      invoiceTitle: p.invoice.title,
      studentId: p.invoice.student.id,
      studentName: p.invoice.student.user.name,
      admissionNo: p.invoice.student.admissionNo,
    })),
    meta: buildMeta(filters.page, filters.limit, total),
  }
}

// ─────────────────────────────────────────────────────────────
//  waive / cancel
// ─────────────────────────────────────────────────────────────

export async function waiveInvoice(actor: Actor, id: string, reason: string) {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can waive invoices')

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { id: true, paidAmount: true, status: true },
  })
  if (!invoice) throw notFound('Invoice')
  if (money(invoice.paidAmount) > 0) throw badRequest('Cannot waive an invoice that has payments')
  if (invoice.status === 'WAIVED') throw badRequest('Invoice is already waived')

  await prisma.invoice.update({
    where: { id },
    data: { status: 'WAIVED', notes: `Waived: ${reason}` },
  })

  return { id, status: 'WAIVED' as const }
}

// ─────────────────────────────────────────────────────────────
//  dashboard summary
// ─────────────────────────────────────────────────────────────

export async function getFeesSummary(actor: Actor) {
  await refreshOverdue()
  const scope = await scopeStudentIds(actor)
  if (actor.role === 'TEACHER') throw forbidden('Teachers cannot view fee summaries')

  const today = dayStart(new Date())
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))

  const [all, statusRows, monthPayments] = await prisma.$transaction([
    prisma.invoice.aggregate({ where: scope, _sum: { totalAmount: true, paidAmount: true } }),
    prisma.invoice.findMany({ where: scope, select: { status: true } }),
    prisma.payment.aggregate({
      where: { paidAt: { gte: monthStart }, invoice: scope },
      _sum: { amount: true },
    }),
  ])

  const billed = money(all._sum.totalAmount)
  const paid = money(all._sum.paidAmount)

  const statusCounts: Record<string, number> = {}
  for (const row of statusRows) statusCounts[row.status] = (statusCounts[row.status] ?? 0) + 1

  return {
    billed,
    paid,
    outstanding: billed - paid,
    collectionRate: billed === 0 ? null : Math.round((paid / billed) * 1000) / 10,
    invoices: {
      total: Object.values(statusCounts).reduce((a, b) => a + b, 0),
      pending: statusCounts['PENDING'] ?? 0,
      partial: statusCounts['PARTIAL'] ?? 0,
      paid: statusCounts['PAID'] ?? 0,
      overdue: statusCounts['OVERDUE'] ?? 0,
      waived: statusCounts['WAIVED'] ?? 0,
      cancelled: statusCounts['CANCELLED'] ?? 0,
    },
    collectedThisMonth: money(monthPayments._sum.amount),
    currency: 'PKR' as const,
  }
}
