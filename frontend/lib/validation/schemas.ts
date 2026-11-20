import { z } from "zod"

/**
 * Client-side mirrors of the backend zod validators.
 *
 * They exist to give instant feedback while typing; the server remains the
 * authority (its messages are what surface for conflicts it alone can detect,
 * such as a duplicate admission number). Rules here are intentionally the same
 * or slightly looser than `backend/src/validators/*`.
 */

const phone = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")

const optionalPhone = z
  .string()
  .trim()
  .max(20)
  .refine((value) => value === "" || value.replace(/\D/g, "").length >= 7, {
    message: "Phone number is too short",
  })
  .optional()

// ── Users ────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  password: z.string().min(8, "Use at least 8 characters").max(72),
})
export type CreateUserValues = z.infer<typeof createUserSchema>

// ── Students ─────────────────────────────────────────────────
export const studentSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: optionalPhone,
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => new Date(value) < new Date(), "Date of birth must be in the past"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Pick a gender" }),
  classId: z.string().optional(),
  sectionId: z.string().optional(),
  rollNo: z.string().trim().max(20).optional(),
  guardianName: z.string().trim().min(1, "Guardian name is required").max(120),
  guardianRelation: z.string().trim().min(1, "Relation is required").max(40),
  guardianPhone: phone,
  guardianEmail: z
    .string()
    .trim()
    .email("Enter a valid guardian email")
    .optional()
    .or(z.literal("")),
})
export type StudentFormValues = z.infer<typeof studentSchema>

// ── Teachers ─────────────────────────────────────────────────
export const teacherSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  phone: optionalPhone,
  department: z.string().trim().min(1, "Department is required").max(80),
  designation: z.string().trim().min(1, "Designation is required").max(80),
  joiningDate: z.string().min(1, "Joining date is required"),
  baseSalary: z.coerce.number().min(0, "Salary cannot be negative").max(10_000_000),
})
export type TeacherFormValues = z.infer<typeof teacherSchema>

// ── Academics ────────────────────────────────────────────────
export const classSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  level: z.coerce.number().int().min(1, "Level 1–20").max(20, "Level 1–20"),
  capacity: z.coerce.number().int().min(1).max(200),
})
export type ClassFormValues = z.infer<typeof classSchema>

export const sectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(5, "Sections are A, B, C…"),
  roomNo: z.string().trim().max(20).optional(),
  capacity: z.coerce.number().int().min(1).max(200),
})
export type SectionFormValues = z.infer<typeof sectionSchema>

export const subjectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  code: z.string().trim().min(2, "Code is too short").max(20),
  classId: z.string().min(1, "Pick a class"),
  creditHours: z.coerce.number().int().min(1).max(10),
  isElective: z.boolean(),
})
export type SubjectFormValues = z.infer<typeof subjectSchema>

// ── Settings ─────────────────────────────────────────────────
export const settingsSchema = z.object({
  "school.name": z.string().trim().min(1, "School name is required").max(120),
  "school.email": z.string().trim().email("Enter a valid email").or(z.literal("")),
  "finance.lateFeePercent": z.coerce.number().min(0, "Cannot be negative").max(100),
  "attendance.warningThreshold": z.coerce.number().min(0).max(100),
})
