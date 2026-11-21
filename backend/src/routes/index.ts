import { Router } from 'express'

/**
 * API v1 router.
 *
 * Every module file exports a router mounted here. Modules land progressively:
 *   Phase 1 → academic years, classes, sections, subjects   (this commit)
 *   Phase 2 → auth ✅ login/refresh/logout/me/change-password · parent role
 *   Phase 3 → students, teachers, attendance, fees
 *   Phase 4 → exams, timetable, notifications, library, transport, hostel,
 *             inventory, payroll
 *   Phase 5 → dashboards + reports
 *
 * Anything not mounted here returns 404 from the central handler, which keeps
 * the contract honest while the surface is being built out.
 */
export const apiRouter = Router()

// ── implemented ───────────────────────────────────────────
import { authRouter } from './auth.routes.js'
import { academicRouter } from './academic.routes.js'
import { studentsRouter } from './students.routes.js'
import { teachersRouter } from './teachers.routes.js'
import { attendanceRouter } from './attendance.routes.js'
import { feesRouter } from './fees.routes.js'
import { examsRouter } from './exams.routes.js'
import { timetableRouter } from './timetable.routes.js'
import { notificationsRouter } from './notifications.routes.js'
import { dashboardRouter } from './dashboard.routes.js'
import { reportsRouter } from './reports.routes.js'
import { adminRouter } from './admin.routes.js'
import { operationsRouter } from './operations.routes.js'
import { uploadsRouter } from './uploads.routes.js'

apiRouter.use(authRouter)
apiRouter.use(academicRouter)
apiRouter.use(studentsRouter)
apiRouter.use(teachersRouter)
apiRouter.use(attendanceRouter)
apiRouter.use(feesRouter)
apiRouter.use(examsRouter)
apiRouter.use(timetableRouter)
apiRouter.use(notificationsRouter)
apiRouter.use(dashboardRouter)
apiRouter.use(reportsRouter)
apiRouter.use(operationsRouter)
apiRouter.use(adminRouter)
apiRouter.use(uploadsRouter)
