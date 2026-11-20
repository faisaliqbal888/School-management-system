import { z } from 'zod'
import { paginationSchema } from '../utils/pagination.js'

const EXAM_TYPE = ['QUIZ', 'UNIT_TEST', 'MIDTERM', 'FINAL', 'PRACTICAL', 'PROJECT'] as const
const EXAM_STATUS = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'PUBLISHED'] as const

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')

export const examListQuery = paginationSchema.extend({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  subjectId: z.string().optional(),
  status: z.enum(EXAM_STATUS).optional(),
  type: z.enum(EXAM_TYPE).optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
})

export const createExamSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  type: z.enum(EXAM_TYPE),
  examDate: isoDate,
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM')
    .nullish(),
  durationMin: z.coerce.number().int().min(10).max(600).optional(),
  totalMarks: z.coerce.number().int().min(1).max(1000).optional(),
  passingMarks: z.coerce.number().int().min(0).max(1000).optional(),
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().nullish(),
  subjectId: z.string().min(1, 'Subject is required'),
})

export const updateExamStatusSchema = z.object({
  status: z.enum(EXAM_STATUS),
})

export const saveMarksSchema = z.object({
  entries: z
    .array(
      z.object({
        studentId: z.string().min(1),
        marksObtained: z.coerce.number().min(0).max(1000).nullable(),
        remarks: z.string().trim().max(200).nullish(),
      }),
    )
    .min(1, 'At least one entry is required')
    .max(300),
})

export const resultListQuery = paginationSchema.extend({
  studentId: z.string().optional(),
  examId: z.string().optional(),
  subjectId: z.string().optional(),
})

export const transcriptQuery = z.object({
  studentId: z.string().optional(),
})

export const idParam = z.object({ id: z.string().min(1) })
