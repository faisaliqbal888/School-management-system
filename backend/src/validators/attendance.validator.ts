import { z } from 'zod'
import { paginationSchema } from '../utils/pagination.js'

const STATUS = ['PRESENT', 'ABSENT', 'LATE', 'EXCUSED', 'HOLIDAY'] as const

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .optional()

export const attendanceHistoryQuery = paginationSchema.extend({
  studentId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.enum(STATUS).optional(),
  from: isoDate,
  to: isoDate,
})

export const attendanceSummaryQuery = z.object({
  studentId: z.string().optional(),
  sectionId: z.string().optional(),
  from: isoDate,
  to: isoDate,
})

export const rosterQuery = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
})

export const bulkMarkSchema = z.object({
  sectionId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        status: z.enum(STATUS),
        remarks: z.string().trim().max(200).nullish(),
      }),
    )
    .min(1, 'At least one student is required')
    .max(200),
})

export const sectionParam = z.object({ sectionId: z.string().min(1) })
