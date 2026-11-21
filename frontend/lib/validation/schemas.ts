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

// ── Password policy ──────────────────────────────────────────
/**
 * Mirrors `strongPasswordSchema` in `backend/src/validators/auth.validator.ts`.
 * Keep the two lists in step — a client that accepts what the server rejects
 * produces a confusing 400 after a round trip.
 */
const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "password1234",
  "12345678",
  "123456789",
  "1234567890",
  "qwerty123",
  "qwertyuiop",
  "letmein123",
  "welcome123",
  "admin123",
  "iloveyou",
  "abc12345",
  "school123",
  "changeme",
  "changeme123",
])

export const strongPassword = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128, "Too long")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[0-9]/, "Add a digit")
  .refine((value) => !COMMON_PASSWORDS.has(value.toLowerCase()), {
    message: "This password is too common",
  })

// ── Users ────────────────────────────────────────────────────
export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT", "PARENT"]),
  password: strongPassword,
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
  // Accepts "" so the select can start empty; the message drives the empty case.
  gender: z
    .string()
    .refine((value) => ["MALE", "FEMALE", "OTHER"].includes(value), "Pick a gender"),
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
  // Free-text extras the enrolment form collects but the API treats as optional.
  bloodGroup: z.string().trim().max(8).optional(),
  address: z.string().trim().max(240).optional(),
  city: z.string().trim().max(80).optional(),
  guardianCnic: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{5}-?\d{7}-?\d$/.test(value), "CNIC looks wrong (12345-1234567-1)")
    .optional(),
  guardianOccupation: z.string().trim().max(80).optional(),
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
  baseSalary: z.coerce
    .number()
    .positive("Enter a valid base salary")
    .max(10_000_000, "That salary looks too high"),
  qualification: z.string().trim().max(120).optional(),
  specialization: z.string().trim().max(120).optional(),
  employmentType: z.enum(["PERMANENT", "CONTRACT", "VISITING", "PART_TIME"]),
  subjectIds: z.array(z.string()).optional(),
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

// ── Notifications ────────────────────────────────────────────
export const AUDIENCES = ["ALL", "ADMINS", "TEACHERS", "STUDENTS", "PARENTS", "CLASS"] as const

export const noticeSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(140),
    body: z.string().trim().min(5, "Message is too short").max(4000),
    audience: z.enum(AUDIENCES),
    classId: z.string(),
  })
  .refine((values) => values.audience !== "CLASS" || values.classId.length > 0, {
    message: "Choose the class this notice is for",
    path: ["classId"],
  })
export type NoticeValues = z.infer<typeof noticeSchema>

// ── Fees ─────────────────────────────────────────────────────
const money = z.coerce.number().min(0, "Cannot be negative")

export const invoiceSchema = z
  .object({
    studentId: z.string().min(1, "Choose a student"),
    title: z.string().trim().min(1, "Enter an invoice title").max(120),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    discount: money,
    fine: money,
    dueDate: z.string().min(1, "Choose a due date"),
    period: z.string(),
    notes: z.string().trim().max(500),
    feeStructureId: z.string(),
  })
  .refine((values) => values.discount <= values.amount, {
    message: "Discount cannot exceed the amount",
    path: ["discount"],
  })
  .refine((values) => values.amount - values.discount + values.fine > 0, {
    message: "Invoice total must be greater than zero",
    path: ["amount"],
  })
export type InvoiceValues = z.infer<typeof invoiceSchema>

export const paymentSchema = z.object({
  amount: z.coerce.number().positive("Enter an amount greater than zero"),
  method: z.enum(["CASH", "BANK_TRANSFER", "CARD", "ONLINE", "CHEQUE"]),
  reference: z.string().trim().max(64),
  notes: z.string().trim().max(500),
})
export type PaymentValues = z.infer<typeof paymentSchema>

// ── Exams ────────────────────────────────────────────────────
export const EXAM_TYPES = ["QUIZ", "UNIT_TEST", "MIDTERM", "FINAL", "PRACTICAL", "PROJECT"] as const

export const examSchema = z
  .object({
    name: z.string().trim().min(1, "Enter an exam name").max(120),
    type: z.enum(EXAM_TYPES),
    classId: z.string().min(1, "Choose a class"),
    sectionId: z.string(),
    subjectId: z.string().min(1, "Choose a subject"),
    examDate: z.string().min(1, "Choose an exam date"),
    startTime: z.string(),
    durationMin: z.coerce.number().int().min(5, "At least 5 minutes").max(600),
    totalMarks: z.coerce.number().int().positive("Total marks must be positive"),
    passingMarks: z.coerce.number().int().min(0),
  })
  .refine((values) => values.passingMarks <= values.totalMarks, {
    message: "Passing marks cannot exceed total marks",
    path: ["passingMarks"],
  })
export type ExamValues = z.infer<typeof examSchema>

// ── Timetable ────────────────────────────────────────────────
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/

export const slotSchema = z
  .object({
    classId: z.string().min(1, "Choose a class"),
    sectionId: z.string(),
    subjectId: z.string().min(1, "Choose a subject"),
    teacherId: z.string(),
    dayOfWeek: z.enum(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"]),
    startTime: z.string().regex(HHMM, "Use HH:MM"),
    endTime: z.string().regex(HHMM, "Use HH:MM"),
    roomNo: z.string().trim().max(20),
  })
  .refine((values) => values.endTime > values.startTime, {
    message: "End time must be after the start time",
    path: ["endTime"],
  })
export type SlotValues = z.infer<typeof slotSchema>

// ── Edit forms ───────────────────────────────────────────────
// Updates may legitimately clear a field, so most rules are "empty or valid".
const STUDENT_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "GRADUATED",
  "TRANSFERRED",
  "WITHDRAWN",
  "PENDING",
] as const

export const studentEditSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  phone: optionalPhone,
  dateOfBirth: z.string(),
  gender: z
    .string()
    .refine((value) => value === "" || ["MALE", "FEMALE", "OTHER"].includes(value), "Pick a gender"),
  bloodGroup: z.string().trim().max(8),
  address: z.string().trim().max(240),
  city: z.string().trim().max(80),
  status: z.enum(STUDENT_STATUSES),
  sectionId: z.string(),
  rollNo: z.string().trim().max(20),
  guardianName: z.string().trim().max(120),
  guardianRelation: z.string().trim().max(40),
  guardianPhone: z
    .string()
    .trim()
    .max(20)
    .refine((value) => value === "" || value.replace(/\D/g, "").length >= 7, "Phone number is too short"),
  guardianEmail: z.string().trim().email("Enter a valid guardian email").or(z.literal("")),
  guardianCnic: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d{5}-?\d{7}-?\d$/.test(value), "CNIC looks wrong (12345-1234567-1)"),
  guardianOccupation: z.string().trim().max(80),
})
export type StudentEditValues = z.infer<typeof studentEditSchema>

export const STAFF_STATUSES = ["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"] as const

export const teacherEditSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  phone: optionalPhone,
  department: z.string().trim().max(80),
  designation: z.string().trim().max(80),
  qualification: z.string().trim().max(120),
  specialization: z.string().trim().max(120),
  joiningDate: z.string(),
  employmentType: z.enum(["PERMANENT", "CONTRACT", "VISITING", "PART_TIME"]),
  baseSalary: z.coerce.number().min(0, "Salary cannot be negative").max(10_000_000),
  status: z.enum(STAFF_STATUSES),
  subjectIds: z.array(z.string()).optional(),
})
export type TeacherEditValues = z.infer<typeof teacherEditSchema>
