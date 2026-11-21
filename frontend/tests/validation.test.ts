import { describe, expect, it } from "vitest"
import {
  createUserSchema,
  examSchema,
  invoiceSchema,
  noticeSchema,
  paymentSchema,
  slotSchema,
  strongPassword,
  studentEditSchema,
  studentSchema,
  teacherEditSchema,
  teacherSchema,
} from "../lib/validation/schemas"

/**
 * These schemas are the client half of every form contract. They must accept
 * what the backend accepts and — more importantly — reject what it rejects, or
 * users get a round trip that ends in a 400.
 */

const validStudent = {
  name: "Hamza Tariq",
  email: "hamza@example.pk",
  phone: "+92 300 1234567",
  dateOfBirth: "2010-05-12",
  gender: "MALE",
  classId: "",
  sectionId: "",
  rollNo: "",
  guardianName: "Tariq Mahmood",
  guardianRelation: "Father",
  guardianPhone: "+92 300 7654321",
  guardianEmail: "",
}

describe("password policy", () => {
  it.each([
    ["too short", "Ab1"],
    ["no uppercase", "lowercase123"],
    ["no lowercase", "UPPERCASE123"],
    ["no digit", "NoDigitsHere"],
    ["common password", "password123"],
  ])("rejects a password that is %s", (_label, candidate) => {
    expect(strongPassword.safeParse(candidate).success).toBe(false)
  })

  it.each(["StrongPassw0rd", "RaviSchool2026", "SecTest2026x"])("accepts %s", (candidate) => {
    expect(strongPassword.safeParse(candidate).success).toBe(true)
  })

  it("is the rule used by the create-user form", () => {
    const base = { name: "New Person", email: "new@example.pk", role: "STUDENT" as const }
    expect(createUserSchema.safeParse({ ...base, password: "weak" }).success).toBe(false)
    expect(createUserSchema.safeParse({ ...base, password: "StrongPassw0rd" }).success).toBe(true)
  })
})

describe("student enrolment", () => {
  it("accepts a complete record", () => {
    expect(studentSchema.safeParse(validStudent).success).toBe(true)
  })

  it("requires a gender but allows the select to start empty", () => {
    expect(studentSchema.safeParse({ ...validStudent, gender: "" }).success).toBe(false)
  })

  it("rejects a date of birth in the future", () => {
    const future = new Date()
    future.setFullYear(future.getFullYear() + 1)
    const result = studentSchema.safeParse({
      ...validStudent,
      dateOfBirth: future.toISOString().slice(0, 10),
    })
    expect(result.success).toBe(false)
  })

  it("allows an empty optional guardian email but not an invalid one", () => {
    expect(studentSchema.safeParse({ ...validStudent, guardianEmail: "" }).success).toBe(true)
    expect(studentSchema.safeParse({ ...validStudent, guardianEmail: "nope" }).success).toBe(false)
  })

  it("checks a CNIC only when one is provided", () => {
    expect(studentSchema.safeParse({ ...validStudent, guardianCnic: "" }).success).toBe(true)
    expect(studentSchema.safeParse({ ...validStudent, guardianCnic: "35202-1234567-1" }).success).toBe(true)
    expect(studentSchema.safeParse({ ...validStudent, guardianCnic: "123" }).success).toBe(false)
  })

  it("lets an edit clear fields that enrolment requires", () => {
    const edit = {
      name: "Hamza Tariq",
      phone: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      address: "",
      city: "",
      status: "ACTIVE" as const,
      sectionId: "",
      rollNo: "",
      guardianName: "",
      guardianRelation: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianCnic: "",
      guardianOccupation: "",
    }
    expect(studentEditSchema.safeParse(edit).success).toBe(true)
  })
})

describe("teacher", () => {
  const validTeacher = {
    name: "Sana Iqbal",
    email: "sana@example.pk",
    phone: "",
    department: "Science",
    designation: "Senior Teacher",
    joiningDate: "2024-08-01",
    baseSalary: 95000,
    employmentType: "PERMANENT" as const,
    qualification: "",
    specialization: "",
    subjectIds: [],
  }

  it("accepts a complete record", () => {
    expect(teacherSchema.safeParse(validTeacher).success).toBe(true)
  })

  it("rejects a zero salary on creation", () => {
    expect(teacherSchema.safeParse({ ...validTeacher, baseSalary: 0 }).success).toBe(false)
  })

  it("does not require a phone number", () => {
    expect(teacherSchema.safeParse({ ...validTeacher, phone: "" }).success).toBe(true)
  })

  it("accepts a zero salary on edit, because staff can be unpaid on record", () => {
    expect(
      teacherEditSchema.safeParse({ ...validTeacher, baseSalary: 0, status: "ACTIVE" }).success,
    ).toBe(true)
  })
})

describe("fees", () => {
  const invoice = {
    studentId: "stu_1",
    title: "Tuition — November",
    amount: 12000,
    discount: 0,
    fine: 0,
    dueDate: "2026-12-01",
    period: "2026-11",
    notes: "",
    feeStructureId: "",
  }

  it("accepts a normal invoice", () => {
    expect(invoiceSchema.safeParse(invoice).success).toBe(true)
  })

  it("rejects a discount larger than the amount", () => {
    const result = invoiceSchema.safeParse({ ...invoice, discount: 20000 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes("discount"))).toBe(true)
    }
  })

  it("rejects a total that nets to zero or less", () => {
    expect(invoiceSchema.safeParse({ ...invoice, amount: 100, discount: 100 }).success).toBe(false)
  })

  it("requires a student and a positive amount", () => {
    expect(invoiceSchema.safeParse({ ...invoice, studentId: "" }).success).toBe(false)
    expect(invoiceSchema.safeParse({ ...invoice, amount: 0 }).success).toBe(false)
  })

  it("accepts a payment with a known method only", () => {
    expect(paymentSchema.safeParse({ amount: 500, method: "CASH", reference: "", notes: "" }).success).toBe(true)
    expect(paymentSchema.safeParse({ amount: 500, method: "BITCOIN", reference: "", notes: "" }).success).toBe(false)
    expect(paymentSchema.safeParse({ amount: 0, method: "CASH", reference: "", notes: "" }).success).toBe(false)
  })
})

describe("exams and timetable", () => {
  const exam = {
    name: "Midterm — Mathematics",
    type: "MIDTERM" as const,
    classId: "cls_1",
    sectionId: "",
    subjectId: "sub_1",
    examDate: "2026-12-10",
    startTime: "09:00",
    durationMin: 120,
    totalMarks: 100,
    passingMarks: 40,
  }

  it("accepts a normal exam", () => {
    expect(examSchema.safeParse(exam).success).toBe(true)
  })

  it("rejects passing marks above the total", () => {
    expect(examSchema.safeParse({ ...exam, passingMarks: 120 }).success).toBe(false)
  })

  it("requires a class and a subject", () => {
    expect(examSchema.safeParse({ ...exam, classId: "" }).success).toBe(false)
    expect(examSchema.safeParse({ ...exam, subjectId: "" }).success).toBe(false)
  })

  const slot = {
    classId: "cls_1",
    sectionId: "",
    subjectId: "sub_1",
    teacherId: "",
    dayOfWeek: "MONDAY" as const,
    startTime: "08:00",
    endTime: "08:45",
    roomNo: "10A",
  }

  it("accepts a normal slot", () => {
    expect(slotSchema.safeParse(slot).success).toBe(true)
  })

  it("rejects an end time at or before the start", () => {
    expect(slotSchema.safeParse({ ...slot, endTime: "08:00" }).success).toBe(false)
    expect(slotSchema.safeParse({ ...slot, endTime: "07:00" }).success).toBe(false)
  })

  it("rejects a malformed time", () => {
    expect(slotSchema.safeParse({ ...slot, startTime: "8:00" }).success).toBe(false)
  })
})

describe("notices", () => {
  const notice = { title: "Fee reminder", body: "Please clear the dues.", audience: "ALL" as const, channel: "IN_APP" as const, classId: "" }

  it("accepts a broadcast", () => {
    expect(noticeSchema.safeParse(notice).success).toBe(true)
  })

  it("requires a class when the audience is CLASS", () => {
    const result = noticeSchema.safeParse({ ...notice, audience: "CLASS", classId: "" })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toContain("classId")
    }
  })

  it("accepts a CLASS notice with a class chosen", () => {
    expect(noticeSchema.safeParse({ ...notice, audience: "CLASS", classId: "cls_1" }).success).toBe(true)
  })

  it("rejects a body that is too short", () => {
    expect(noticeSchema.safeParse({ ...notice, body: "hi" }).success).toBe(false)
  })

  it("only accepts known channels", () => {
    expect(noticeSchema.safeParse({ ...notice, channel: "CARRIER_PIGEON" }).success).toBe(false)
    expect(noticeSchema.safeParse({ ...notice, channel: "EMAIL" }).success).toBe(true)
  })
})
