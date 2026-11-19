import { z } from 'zod'
import { paginationSchema } from '../utils/pagination.js'

const INVOICE_STATUS = ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED', 'WAIVED'] as const
const PAYMENT_METHOD = ['CASH', 'BANK_TRANSFER', 'CARD', 'ONLINE', 'CHEQUE'] as const

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')

export const invoiceListQuery = paginationSchema.extend({
  status: z.enum(INVOICE_STATUS).optional(),
  studentId: z.string().optional(),
  classId: z.string().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM').optional(),
})

export const paymentListQuery = paginationSchema.extend({
  invoiceId: z.string().optional(),
})

export const createFeeStructureSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  classId: z.string().min(1, 'Class is required'),
  subjectId: z.string().nullish(),
  amount: z.coerce.number().positive('Amount must be greater than zero').max(10_000_000),
  frequency: z.enum(['MONTHLY', 'QUARTERLY', 'ANNUAL', 'ONE_TIME']).optional(),
  dueDay: z.coerce.number().int().min(1).max(28).optional(),
})

export const createInvoiceSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  title: z.string().trim().min(1, 'Title is required').max(160),
  amount: z.coerce.number().positive('Amount must be greater than zero').max(10_000_000),
  discount: z.coerce.number().min(0).optional(),
  fine: z.coerce.number().min(0).optional(),
  dueDate: isoDate,
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM').nullish(),
  notes: z.string().trim().max(300).nullish(),
  feeStructureId: z.string().nullish(),
})

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice is required'),
  amount: z.coerce.number().positive('Amount must be greater than zero').max(10_000_000),
  method: z.enum(PAYMENT_METHOD).optional(),
  reference: z.string().trim().max(120).nullish(),
  notes: z.string().trim().max(300).nullish(),
  paidAt: z.string().optional(),
})

export const generateInvoicesSchema = z.object({
  feeStructureId: z.string().min(1, 'Fee structure is required'),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be YYYY-MM'),
})

export const waiveInvoiceSchema = z.object({
  reason: z.string().trim().min(3, 'Please give a reason').max(200),
})

export const idParam = z.object({ id: z.string().min(1) })
