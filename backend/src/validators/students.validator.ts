import { z } from 'zod'
import { strongPasswordSchema } from './auth.validator.js'
import { paginationSchema } from '../utils/pagination.js'

const STUDENT_STATUS = [
  'ACTIVE',
  'INACTIVE',
  'GRADUATED',
  'TRANSFERRED',
  'WITHDRAWN',
  'PENDING',
] as const

export const studentListQuery = paginationSchema.extend({
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  status: z.enum(STUDENT_STATUS).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
})

const phone = z
  .string()
  .trim()
  .min(7, 'Phone number is too short')
  .max(20, 'Phone number is too long')

const guardianSchema = z.object({
  name: z.string().trim().min(1, 'Guardian name is required').max(120),
  relation: z.string().trim().min(1, 'Relation is required').max(40),
  phone,
  email: z.string().trim().email('Invalid guardian email').max(200).nullish(),
  cnic: z.string().trim().max(20).nullish(),
  occupation: z.string().trim().max(80).nullish(),
})

export const createStudentSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(120),
  email: z.string().trim().email('Invalid email address').max(200),
  phone: phone.nullish(),
  dateOfBirth: z.coerce.date().refine((d) => d < new Date(), 'Date of birth must be in the past'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().trim().max(5).nullish(),
  address: z.string().trim().max(300).nullish(),
  city: z.string().trim().max(80).nullish(),
  admissionDate: z.coerce.date().optional(),
  classId: z.string().nullish(),
  sectionId: z.string().nullish(),
  rollNo: z.string().trim().max(20).nullish(),
  photoUrl: z.string().trim().max(300).nullish(),
  guardian: guardianSchema,
  password: strongPasswordSchema.optional(),
})

export const updateStudentSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: phone.nullish(),
    dateOfBirth: z.coerce.date().optional(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
    bloodGroup: z.string().trim().max(5).nullish(),
    address: z.string().trim().max(300).nullish(),
    city: z.string().trim().max(80).nullish(),
    status: z.enum(STUDENT_STATUS).optional(),
    classId: z.string().nullish(),
    sectionId: z.string().nullish(),
    rollNo: z.string().trim().max(20).nullish(),
    photoUrl: z.string().trim().max(300).nullish(),
    guardian: guardianSchema.partial().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

export const studentIdParam = z.object({ id: z.string().min(1) })

export const deleteQuery = z.object({
  hard: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
})

export type CreateStudentBody = z.infer<typeof createStudentSchema>
export type UpdateStudentBody = z.infer<typeof updateStudentSchema>
