import { Router } from 'express'

/**
 * API v1 router.
 *
 * Every module file exports a router mounted here. Modules land progressively:
 *   Phase 1 → academic years, classes, sections, subjects   (this commit)
 *   Phase 2 → auth (login/refresh/logout/me)
 *   Phase 3 → students, teachers, attendance, fees
 *   Phase 4 → exams, timetable, notifications, library, transport, hostel,
 *             inventory, payroll
 *   Phase 5 → dashboards + reports
 *
 * Anything not mounted here returns 404 from the central handler, which keeps
 * the contract honest while the surface is being built out.
 */
export const apiRouter = Router()

// Implemented in this phase
import { academicRouter } from './academic.routes.js'
apiRouter.use(academicRouter)
