import { z } from 'zod'
import { paginationSchema } from '../utils/pagination.js'

const STAFF_STATUS = ['ACTIVE', 'ON_LEAVE', 'RESIGNED', 'TERMINATED'] as const
const EMPLOYMENT_TYPE = ['PERMANENT', 'CONTRACT', 'VISITING', 'PART_TIME'] as const

export const teacherListQuery = paginationSchema.extend({
  department: z.string().trim().optional(),
  status: z.enum(STAFF_STATUS).optional(),
  employmentType: z.enum(EMPLOYMENT_TYPE).optional(),
})

const phone = z.string().trim().min(7, 'Phone number is too short').max(20, 'Phone number is too long')

export const createTeacherSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(120),
  email: z.string().trim().email('Invalid email address').max(200),
  phone: phone.nullish(),
  department: z.string().trim().min(1, 'Department is required').max(80),
  designation: z.string().trim().min(1, 'Designation is required').max(80),
  qualification: z.string().trim().max(120).nullish(),
  specialization: z.string().trim().max(120).nullish(),
  joiningDate: z.coerce.date(),
  employmentType: z.enum(EMPLOYMENT_TYPE).optional(),
  baseSalary: z.coerce.number().min(0, 'Salary cannot be negative').max(10_000_000),
  subjectIds: z.array(z.string().min(1)).max(30).optional(),
  password: z.string().min(8, 'Password must be at least 8 characters').max(200).optional(),
  dob: z.coerce.date().nullish(),
  address: z.string().trim().max(300).nullish(),
  city: z.string().trim().max(80).nullish(),
})

export const updateTeacherSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    phone: phone.nullish(),
    department: z.string().trim().min(1).max(80).optional(),
    designation: z.string().trim().min(1).max(80).optional(),
    qualification: z.string().trim().max(120).nullish(),
    specialization: z.string().trim().max(120).nullish(),
    joiningDate: z.coerce.date().optional(),
    employmentType: z.enum(EMPLOYMENT_TYPE).optional(),
    baseSalary: z.coerce.number().min(0).max(10_000_000).optional(),
    status: z.enum(STAFF_STATUS).optional(),
    subjectIds: z.array(z.string().min(1)).max(30).optional(),
    dob: z.coerce.date().nullish(),
    address: z.string().trim().max(300).nullish(),
    city: z.string().trim().max(80).nullish(),
  })
  .refine((data) => Object.keys(data).length > 0, 'Nothing to update')

export const teacherIdParam = z.object({ id: z.string().min(1) })

export type CreateTeacherBody = z.infer<typeof createTeacherSchema>
export type UpdateTeacherBody = z.infer<typeof updateTeacherSchema>
