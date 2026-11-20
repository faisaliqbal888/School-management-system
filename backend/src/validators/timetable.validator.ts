import { z } from 'zod'

const DAY = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be HH:MM (24h)')

export const createSlotSchema = z.object({
  classId: z.string().min(1, 'Class is required'),
  sectionId: z.string().nullish(),
  subjectId: z.string().min(1, 'Subject is required'),
  teacherId: z.string().nullish(),
  dayOfWeek: z.enum(DAY),
  startTime: time,
  endTime: time,
  roomNo: z.string().trim().max(20).nullish(),
})

export const updateSlotSchema = createSlotSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

export const sectionParam = z.object({ sectionId: z.string().min(1) })
export const teacherParam = z.object({ teacherId: z.string().min(1) })
export const slotIdParam = z.object({ id: z.string().min(1) })
