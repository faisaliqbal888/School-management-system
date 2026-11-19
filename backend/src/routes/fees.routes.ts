import { Router } from 'express'
import type { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../utils/response.js'
import * as fees from '../services/fees.service.js'
import {
  createFeeStructureSchema,
  createInvoiceSchema,
  generateInvoicesSchema,
  idParam,
  invoiceListQuery,
  paymentListQuery,
  recordPaymentSchema,
  waiveInvoiceSchema,
} from '../validators/fees.validator.js'
import type { Role } from '@prisma/client'

export const feesRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

// ─────────────────────────────────────────────────────────────
//  GET /fees/summary — role-scoped totals (admin | student | parent)
// ─────────────────────────────────────────────────────────────
feesRouter.get(
  '/fees/summary',
  authenticate,
  asyncHandler(async (req, res) => {
    ok(res, await fees.getFeesSummary(actorOf(req)))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Fee structures (ADMIN)
// ─────────────────────────────────────────────────────────────
feesRouter.get(
  '/fees/structures',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    ok(res, await fees.listFeeStructures(actorOf(req)))
  }),
)

feesRouter.post(
  '/fees/structures',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createFeeStructureSchema }),
  asyncHandler(async (req, res) => {
    created(res, await fees.createFeeStructure(actorOf(req), req.body as z.infer<typeof createFeeStructureSchema>))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Invoices
// ─────────────────────────────────────────────────────────────
feesRouter.get(
  '/fees/invoices',
  authenticate,
  validate({ query: invoiceListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof invoiceListQuery>
    const { items, meta, totals } = await fees.listInvoices(actorOf(req), filters)
    res.status(200).json({ success: true, data: items, meta: { ...meta, ...totals } })
  }),
)

feesRouter.get(
  '/fees/invoices/:id',
  authenticate,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await fees.getInvoice(actorOf(req), String(req.params['id'])))
  }),
)

feesRouter.post(
  '/fees/invoices',
  authenticate,
  authorize('ADMIN'),
  validate({ body: createInvoiceSchema }),
  asyncHandler(async (req, res) => {
    created(res, await fees.createInvoice(actorOf(req), req.body as z.infer<typeof createInvoiceSchema>))
  }),
)

feesRouter.post(
  '/fees/invoices/generate',
  authenticate,
  authorize('ADMIN'),
  validate({ body: generateInvoicesSchema }),
  asyncHandler(async (req, res) => {
    created(res, await fees.generateMonthlyInvoices(actorOf(req), req.body as z.infer<typeof generateInvoicesSchema>))
  }),
)

feesRouter.patch(
  '/fees/invoices/:id/waive',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam, body: waiveInvoiceSchema }),
  asyncHandler(async (req, res) => {
    const { reason } = req.body as z.infer<typeof waiveInvoiceSchema>
    ok(res, await fees.waiveInvoice(actorOf(req), String(req.params['id']), reason))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Payments
// ─────────────────────────────────────────────────────────────
feesRouter.post(
  '/fees/payments',
  authenticate,
  authorize('ADMIN'),
  validate({ body: recordPaymentSchema }),
  asyncHandler(async (req, res) => {
    created(res, await fees.recordPayment(actorOf(req), req.body as z.infer<typeof recordPaymentSchema>))
  }),
)

feesRouter.get(
  '/fees/payments',
  authenticate,
  validate({ query: paymentListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof paymentListQuery>
    const { items, meta } = await fees.listPayments(actorOf(req), filters)
    ok(res, items, meta)
  }),
)
