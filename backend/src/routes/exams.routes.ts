import { Router } from 'express'
import type { z } from 'zod'
import { asyncHandler } from '../utils/async-handler.js'
import { authenticate, authorize } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { ok, created } from '../utils/response.js'
import * as exams from '../services/exams.service.js'
import {
  createExamSchema,
  examListQuery,
  idParam,
  resultListQuery,
  saveMarksSchema,
  transcriptQuery,
  updateExamStatusSchema,
} from '../validators/exams.validator.js'
import type { Role } from '@prisma/client'

export const examsRouter = Router()

const actorOf = (req: { user?: { id: string; role: Role } }) => ({
  id: req.user!.id,
  role: req.user!.role,
})

// ─────────────────────────────────────────────────────────────
//  Exams
// ─────────────────────────────────────────────────────────────
examsRouter.get(
  '/exams',
  authenticate,
  validate({ query: examListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof examListQuery>
    const { items, meta } = await exams.listExams(actorOf(req), filters)
    ok(res, items, meta)
  }),
)

examsRouter.get(
  '/exams/:id',
  authenticate,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await exams.getExam(actorOf(req), String(req.params['id'])))
  }),
)

examsRouter.post(
  '/exams',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ body: createExamSchema }),
  asyncHandler(async (req, res) => {
    created(res, await exams.createExam(actorOf(req), req.body as z.infer<typeof createExamSchema>))
  }),
)

examsRouter.patch(
  '/exams/:id/status',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ params: idParam, body: updateExamStatusSchema }),
  asyncHandler(async (req, res) => {
    const { status } = req.body as z.infer<typeof updateExamStatusSchema>
    ok(res, await exams.updateExamStatus(actorOf(req), String(req.params['id']), status))
  }),
)

examsRouter.delete(
  '/exams/:id',
  authenticate,
  authorize('ADMIN'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await exams.deleteExam(actorOf(req), String(req.params['id'])))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Marks entry (staff)
// ─────────────────────────────────────────────────────────────
examsRouter.get(
  '/exams/:id/marks',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await exams.getMarksRoster(actorOf(req), String(req.params['id'])))
  }),
)

examsRouter.post(
  '/exams/:id/marks',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ params: idParam, body: saveMarksSchema }),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof saveMarksSchema>
    ok(res, await exams.saveMarks(actorOf(req), String(req.params['id']), body))
  }),
)

examsRouter.get(
  '/exams/:id/analysis',
  authenticate,
  authorize('ADMIN', 'TEACHER'),
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    ok(res, await exams.getExamAnalysis(actorOf(req), String(req.params['id'])))
  }),
)

// ─────────────────────────────────────────────────────────────
//  Results (published only for learners)
// ─────────────────────────────────────────────────────────────
examsRouter.get(
  '/results',
  authenticate,
  validate({ query: resultListQuery }),
  asyncHandler(async (req, res) => {
    const filters = req.query as unknown as z.infer<typeof resultListQuery>
    const { items, meta } = await exams.listResults(actorOf(req), filters)
    ok(res, items, meta)
  }),
)

examsRouter.get(
  '/results/transcript',
  authenticate,
  validate({ query: transcriptQuery }),
  asyncHandler(async (req, res) => {
    const { studentId } = req.query as unknown as z.infer<typeof transcriptQuery>
    ok(res, await exams.getTranscript(actorOf(req), { studentId }))
  }),
)
