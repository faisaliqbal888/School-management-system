/**
 * Database seed — a realistic Pakistani school.
 *
 *   Ravi International School, Lahore
 *   Academic year 2025-2026 · classes 6-10 · PKR fees
 *
 * Run:  npm run db:seed        (after `npm run migrate:deploy`)
 * Idempotent: re-running wipes and re-creates the demo data only.
 */
import { PrismaClient, Role, Gender, type Prisma } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] ?? '' })
const prisma = new PrismaClient({ adapter })

const BCRYPT_ROUNDS = 10
const DEMO_PASSWORD = 'Password123'

// ─────────────────────────────────────────────────────────────
//  helpers
// ─────────────────────────────────────────────────────────────

const rand = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)] as T
const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

const date = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d))

/** Pakistani mobile number: 03xx-xxxxxxx */
const phone = () => `+92${randInt(300, 349)}${String(randInt(1000000, 9999999))}`

/** CNIC: xxxxx-xxxxxxx-x */
const cnic = () =>
  `${randInt(30000, 42000)}-${String(randInt(1000000, 9999999))}-${randInt(0, 9)}`

const FIRST_MALE = ['Ahmed', 'Ali', 'Hassan', 'Usman', 'Bilal', 'Hamza', 'Zain', 'Umar', 'Saad', 'Faisal', 'Abdullah', 'Ibrahim', 'Talha', 'Danish', 'Arham']
const FIRST_FEMALE = ['Ayesha', 'Fatima', 'Zainab', 'Maryam', 'Hira', 'Sana', 'Amna', 'Noor', 'Rabia', 'Iqra', 'Sara', 'Mahnoor', 'Laiba', 'Eman', 'Anaya']
const LAST_NAMES = ['Khan', 'Ahmed', 'Ali', 'Malik', 'Sheikh', 'Butt', 'Chaudhry', 'Raza', 'Qureshi', 'Hashmi', 'Siddiqui', 'Baig', 'Abbasi', 'Awan', 'Mirza']
const CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar']

const TEACHER_DEPARTMENTS = ['Mathematics', 'Science', 'English', 'Urdu', 'Computer Science', 'Islamiat', 'Social Studies']

// ─────────────────────────────────────────────────────────────
//  seed
// ─────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database…\n')

  // Wipe in FK-safe order (children first).
  console.log('  • clearing existing demo data')
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.examResult.deleteMany(),
    prisma.exam.deleteMany(),
    prisma.attendance.deleteMany(),
    prisma.timetableSlot.deleteMany(),
    prisma.bookIssue.deleteMany(),
    prisma.book.deleteMany(),
    prisma.studentRoute.deleteMany(),
    prisma.transportRoute.deleteMany(),
    prisma.vehicle.deleteMany(),
    prisma.hostelAllocation.deleteMany(),
    prisma.hostelRoom.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.payroll.deleteMany(),
    prisma.leaveRequest.deleteMany(),
    prisma.subjectAssignment.deleteMany(),
    prisma.teacherSubject.deleteMany(),
    prisma.enrollment.deleteMany(),
    prisma.guardian.deleteMany(),
    prisma.parent.deleteMany(),
    prisma.student.deleteMany(),
    prisma.feeStructure.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.section.deleteMany(),
    prisma.class.deleteMany(),
    prisma.teacher.deleteMany(),
    prisma.staff.deleteMany(),
    prisma.academicYear.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.schoolSetting.deleteMany(),
    prisma.user.deleteMany(),
  ])

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_ROUNDS)

  // ── settings ─────────────────────────────────────────────
  await prisma.schoolSetting.createMany({
    data: [
      { key: 'school.name', value: 'Ravi International School' },
      { key: 'school.address', value: '12-Canal Road, Lahore, Punjab' },
      { key: 'school.phone', value: '+92-42-3577-8899' },
      { key: 'school.email', value: 'info@ravischool.edu.pk' },
      { key: 'school.currency', value: 'PKR' },
      { key: 'school.timezone', value: 'Asia/Karachi' },
    ],
  })

  // ── academic year + classes + sections ───────────────────
  console.log('  • academic year, classes, sections')
  const academicYear = await prisma.academicYear.create({
    data: { name: '2025-2026', startDate: date(2025, 8, 1), endDate: date(2026, 5, 31), isCurrent: true },
  })

  const LEVELS = [6, 7, 8, 9, 10]
  const classes: { id: string; level: number; name: string }[] = []
  const sections: { id: string; classId: string; name: string; level: number }[] = []

  for (const level of LEVELS) {
    const cls = await prisma.class.create({
      data: { name: `Grade ${level}`, level, academicYearId: academicYear.id, capacity: 40 },
    })
    classes.push({ id: cls.id, level, name: cls.name })

    for (const sectionName of ['A', 'B']) {
      const sec = await prisma.section.create({
        data: { classId: cls.id, name: sectionName, roomNo: `${level}${sectionName}`, capacity: 40 },
      })
      sections.push({ id: sec.id, classId: cls.id, name: sec.name, level })
    }
  }

  // ── subjects ─────────────────────────────────────────────
  console.log('  • subjects')
  const SUBJECT_MAP: Record<number, string[]> = {
    6: ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Social Studies', 'Computer Science'],
    7: ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Social Studies', 'Computer Science'],
    8: ['English', 'Urdu', 'Mathematics', 'Science', 'Islamiat', 'Social Studies', 'Computer Science'],
    9: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Islamiat', 'Computer Science'],
    10: ['English', 'Urdu', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Islamiat', 'Computer Science'],
  }
  const CODE: Record<string, string> = {
    English: 'ENG', Urdu: 'URD', Mathematics: 'MATH', Science: 'SCI', Islamiat: 'ISL',
    'Social Studies': 'SST', 'Computer Science': 'CS', Physics: 'PHY', Chemistry: 'CHEM', Biology: 'BIO',
  }

  const subjectsByClass: Record<string, { id: string; name: string }[]> = {}
  for (const cls of classes) {
    subjectsByClass[cls.id] = []
    for (const name of SUBJECT_MAP[cls.level] ?? []) {
      const subject = await prisma.subject.create({
        data: {
          name,
          code: `${CODE[name]}-${cls.level}`,
          classId: cls.id,
          creditHours: name === 'Mathematics' || name === 'English' ? 2 : 1,
        },
      })
      subjectsByClass[cls.id]!.push({ id: subject.id, name: subject.name })
    }
  }

  // ── teachers ─────────────────────────────────────────────
  console.log('  • teachers & staff')
  const TEACHER_COUNT = 14
  const teachers: { id: string; userId: string; name: string; department: string; baseSalary: number }[] = []

  for (let i = 0; i < TEACHER_COUNT; i++) {
    const male = i % 2 === 0
    // Teacher #1 is a fixed demo account — the login page links straight to it.
    const isDemoTeacher = i === 0
    const first = isDemoTeacher ? 'Ahmed' : male ? rand(FIRST_MALE) : rand(FIRST_FEMALE)
    const name = isDemoTeacher ? 'Ahmed Khan' : `${first} ${rand(LAST_NAMES)}`
    const department = isDemoTeacher ? 'Mathematics' : TEACHER_DEPARTMENTS[i % TEACHER_DEPARTMENTS.length]!
    const email = isDemoTeacher ? 'ahmed.1@ravischool.edu.pk' : `${first.toLowerCase()}.${i + 1}@ravischool.edu.pk`

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.TEACHER,
        name,
        phone: phone(),
        avatarUrl: isDemoTeacher
          ? '/male-teacher-portrait.png'
          : male
            ? '/male-teacher-portrait.png'
            : '/female-teacher-portrait.png',
      },
    })

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        employeeNo: `EMP-2025-${String(i + 1).padStart(3, '0')}`,
        department,
        designation: i === 0 ? 'Head of Department' : i < 3 ? 'Senior Teacher' : 'Teacher',
        qualification: rand(['MSc', 'MA', 'MPhil', 'BEd']),
        specialization: department,
        joiningDate: date(randInt(2015, 2024), randInt(1, 12), randInt(1, 28)),
        employmentType: 'PERMANENT',
        baseSalary: 85000 + i * 6500,
        status: 'ACTIVE',
      },
    })

    teachers.push({ id: teacher.id, userId: user.id, name, department, baseSalary: 85000 + i * 6500 })
  }

  // Assign subjects to teachers.
  // Each teacher is linked to *one* subject per class level (e.g. Mathematics
  // for Grade 6, 7, 8 …) so a teacher's subject list never repeats a name.
  const allSubjects = Object.values(subjectsByClass).flat() as { id: string; name: string }[]
  for (const teacher of teachers) {
    const matching = allSubjects.filter((s) => s.name === teacher.department)
    const pool = matching.length ? matching : allSubjects
    const seenNames = new Set<string>()
    for (const subject of pool) {
      if (seenNames.has(subject.name)) continue
      seenNames.add(subject.name)
      await prisma.teacherSubject
        .create({ data: { teacherId: teacher.id, subjectId: subject.id } })
        .catch(() => undefined)
    }
  }

  // set class teachers
  for (let i = 0; i < classes.length; i++) {
    await prisma.class.update({
      where: { id: classes[i]!.id },
      data: { classTeacherId: teachers[i % teachers.length]!.id },
    })
  }

  // non-teaching staff
  const STAFF_ROLES = [
    { designation: 'Principal', department: 'Administration', salary: 250000 },
    { designation: 'Accountant', department: 'Finance', salary: 95000 },
    { designation: 'Librarian', department: 'Library', salary: 65000 },
    { designation: 'Lab Assistant', department: 'Science', salary: 55000 },
    { designation: 'IT Support', department: 'IT', salary: 75000 },
    { designation: 'Security Guard', department: 'Security', salary: 40000 },
    { designation: 'Cleaner', department: 'Maintenance', salary: 35000 },
    { designation: 'Receptionist', department: 'Administration', salary: 50000 },
  ]

  const staffMembers: { id: string; name: string }[] = []
  for (let i = 0; i < STAFF_ROLES.length; i++) {
    const role = STAFF_ROLES[i]!
    const name = `${rand([...FIRST_MALE, ...FIRST_FEMALE])} ${rand(LAST_NAMES)}`
    const member = await prisma.staff.create({
      data: {
        employeeNo: `STF-2025-${String(i + 1).padStart(3, '0')}`,
        name,
        designation: role.designation,
        department: role.department,
        email: `staff${i + 1}@ravischool.edu.pk`,
        phone: phone(),
        cnic: cnic(),
        joiningDate: date(randInt(2016, 2024), randInt(1, 12), randInt(1, 28)),
        employmentType: 'PERMANENT',
        baseSalary: role.salary,
        status: 'ACTIVE',
      },
    })
    staffMembers.push({ id: member.id, name })
  }

  // ── fee structures ───────────────────────────────────────
  console.log('  • fee structures')
  const feeByClass: Record<string, { id: string; amount: number }> = {}
  for (const cls of classes) {
    const tuition = 12000 + (cls.level - 6) * 2000
    const fee = await prisma.feeStructure.create({
      data: {
        name: `${cls.name} — Tuition Fee`,
        classId: cls.id,
        amount: tuition,
        frequency: 'MONTHLY',
        dueDay: 10,
        isActive: true,
      },
    })
    feeByClass[cls.id] = { id: fee.id, amount: tuition }

    await prisma.feeStructure.create({
      data: {
        name: `${cls.name} — Annual Charges`,
        classId: cls.id,
        amount: 15000,
        frequency: 'ANNUAL',
        dueDay: 31,
        isActive: true,
      },
    })
  }

  // ── students ─────────────────────────────────────────────
  console.log('  • students, guardians & enrollments')
  const STUDENTS_PER_SECTION = 8
  const DEMO_STUDENT_ID = 'student-001'
  let admissionCounter = 0

  const students: { id: string; userId: string; name: string; classId: string; sectionId: string; rollNo: string }[] = []
  const invoicesToCreate: Prisma.InvoiceCreateManyInput[] = []
  let invoiceCounter = 0

  for (const section of sections) {
    for (let i = 0; i < STUDENTS_PER_SECTION; i++) {
      admissionCounter++
      const male = (admissionCounter + i) % 2 === 0
      const first = male ? rand(FIRST_MALE) : rand(FIRST_FEMALE)
      const last = rand(LAST_NAMES)
      const name = `${first} ${last}`
      const isDemoStudent = admissionCounter === 1

      const email = isDemoStudent
        ? 'student@ravischool.edu.pk'
        : `${first.toLowerCase()}.${last.toLowerCase()}.${admissionCounter}@student.ravischool.edu.pk`

      const user = await prisma.user.create({
        data: {
          ...(isDemoStudent ? { id: DEMO_STUDENT_ID } : {}),
          email,
          passwordHash,
          role: Role.STUDENT,
          name,
          phone: phone(),
          avatarUrl: male ? '/alex-student.jpg' : '/emma-student.jpg',
        },
      })

      const rollNo = `${section.level}${section.name}${String(i + 1).padStart(2, '0')}`
      const student = await prisma.student.create({
        data: {
          userId: user.id,
          admissionNo: `ADM-2025-${String(admissionCounter).padStart(4, '0')}`,
          rollNo,
          dateOfBirth: date(2026 - section.level - 5, randInt(1, 12), randInt(1, 28)),
          gender: male ? Gender.MALE : Gender.FEMALE,
          bloodGroup: rand(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+']),
          address: `House ${randInt(1, 400)}, Block ${rand(['A', 'B', 'C', 'D', 'E'])}, ${rand(CITIES)}`,
          city: rand(CITIES),
          admissionDate: date(2025, 8, randInt(1, 20)),
          status: 'ACTIVE',
          classId: section.classId,
        },
      })

      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: section.classId,
          sectionId: section.id,
          academicYearId: academicYear.id,
          rollNo,
        },
      })

      // guardian
      await prisma.guardian.create({
        data: {
          studentId: student.id,
          name: `${rand(FIRST_MALE)} ${last}`,
          relation: 'Father',
          phone: phone(),
          email: `guardian.${admissionCounter}@example.pk`,
          cnic: cnic(),
          occupation: rand(['Businessman', 'Engineer', 'Doctor', 'Teacher', 'Government Officer', 'Shopkeeper']),
          isPrimary: true,
          isEmergency: true,
        },
      })

      students.push({ id: student.id, userId: user.id, name, classId: section.classId, sectionId: section.id, rollNo })

      // invoice for the current month
      const fee = feeByClass[section.classId]
      if (fee) {
        invoiceCounter++
        const paid = Math.random() < 0.65
        invoicesToCreate.push({
          invoiceNo: `INV-2025-${String(invoiceCounter).padStart(4, '0')}`,
          studentId: student.id,
          sectionId: section.id,
          feeStructureId: fee.id,
          title: 'Tuition Fee — November 2025',
          period: '2025-11',
          amount: fee.amount,
          totalAmount: fee.amount,
          paidAmount: paid ? fee.amount : 0,
          dueDate: date(2025, 11, 10),
          status: paid ? 'PAID' : Math.random() < 0.3 ? 'OVERDUE' : 'PENDING',
        })
      }
    }
  }

  await prisma.invoice.createMany({ data: invoicesToCreate })

  // demo parent linked to the demo student
  const demoStudent = students[0]!
  const parentUser = await prisma.user.create({
    data: {
      email: 'parent@ravischool.edu.pk',
      passwordHash,
      role: Role.PARENT,
      name: 'Imran Ahmed',
      phone: phone(),
    },
  })
  const parent = await prisma.parent.create({
    data: { userId: parentUser.id, occupation: 'Engineer', cnic: cnic() },
  })
  await prisma.guardian.updateMany({
    where: { studentId: demoStudent.id },
    data: { parentId: parent.id },
  })

  // ── attendance (last 20 school days) ─────────────────────
  console.log('  • attendance')
  const attendanceRows: Prisma.AttendanceCreateManyInput[] = []
  const today = new Date()
  let dayOffset = 0
  while (dayOffset < 28) {
    const d = new Date(today)
    d.setUTCDate(d.getUTCDate() - dayOffset)
    dayOffset++
    if (d.getUTCDay() === 0 || d.getUTCDay() === 6) continue // skip weekend

    for (const student of students) {
      const roll = Math.random()
      attendanceRows.push({
        studentId: student.id,
        sectionId: student.sectionId,
        date: new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())),
        status: roll < 0.9 ? 'PRESENT' : roll < 0.96 ? 'ABSENT' : 'LATE',
        markedBy: teachers[0]!.userId,
      })
    }
  }
  await prisma.attendance.createMany({ data: attendanceRows })

  // ── exams & results (midterm) ────────────────────────────
  console.log('  • exams & results')
  for (const cls of classes) {
    const subjects = subjectsByClass[cls.id] ?? []
    for (const subject of subjects.slice(0, 4)) {
      const exam = await prisma.exam.create({
        data: {
          name: `Midterm 2025 — ${subject.name}`,
          type: 'MIDTERM',
          examDate: date(2025, 10, randInt(10, 25)),
          startTime: '09:00',
          durationMin: 120,
          totalMarks: 100,
          passingMarks: 40,
          classId: cls.id,
          subjectId: subject.id,
          createdById: teachers[0]!.id,
          status: 'PUBLISHED',
        },
      })

      const classStudents = students.filter((s) => s.classId === cls.id)
      await prisma.examResult.createMany({
        data: classStudents.map((s) => {
          const marks = randInt(35, 98)
          return {
            examId: exam.id,
            studentId: s.id,
            subjectId: subject.id,
            marksObtained: marks,
            grade: marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B' : marks >= 60 ? 'C' : marks >= 50 ? 'D' : marks >= 40 ? 'E' : 'F',
            enteredById: teachers[0]!.userId,
          }
        }),
      })
    }
  }

  // ── timetable (Grade 10-A) ───────────────────────────────
  console.log('  • timetable')
  const grade10 = classes.find((c) => c.level === 10)!
  const grade10Section = sections.find((s) => s.level === 10 && s.name === 'A')!
  const grade10Subjects = subjectsByClass[grade10.id] ?? []
  const PERIODS = [
    { start: '08:00', end: '08:45' },
    { start: '08:45', end: '09:30' },
    { start: '09:30', end: '10:15' },
    { start: '10:30', end: '11:15' },
    { start: '11:15', end: '12:00' },
    { start: '12:00', end: '12:45' },
  ]
  const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'] as const

  for (const day of DAYS) {
    for (let p = 0; p < PERIODS.length; p++) {
      const subject = grade10Subjects[p % grade10Subjects.length]
      if (!subject) continue
      await prisma.timetableSlot.create({
        data: {
          classId: grade10.id,
          sectionId: grade10Section.id,
          subjectId: subject.id,
          teacherId: teachers[p % teachers.length]!.id,
          dayOfWeek: day,
          startTime: PERIODS[p]!.start,
          endTime: PERIODS[p]!.end,
          roomNo: `10A`,
        },
      })
    }
  }

  // ── library ──────────────────────────────────────────────
  console.log('  • library')
  const BOOKS = [
    { title: 'Mathematics for Class 10', author: 'PTB', category: 'Textbook', isbn: '978-969-001-001-1' },
    { title: 'Physics — Concepts & Practice', author: 'Dr. A. R. Khan', category: 'Textbook', isbn: '978-969-001-002-8' },
    { title: 'Chemistry Essentials', author: 'S. Mahmood', category: 'Textbook', isbn: '978-969-001-003-5' },
    { title: 'English Grammar in Use', author: 'Raymond Murphy', category: 'Reference', isbn: '978-0-521-53762-9' },
    { title: 'Urdu Adab — Selected Prose', author: 'Various', category: 'Literature', isbn: '978-969-001-004-2' },
    { title: 'Introduction to Algorithms', author: 'Cormen et al.', category: 'Reference', isbn: '978-0-262-04630-5' },
    { title: 'The Alchemist', author: 'Paulo Coelho', category: 'Fiction', isbn: '978-0-06-250217-9' },
    { title: 'Pakistan Studies', author: 'PTB', category: 'Textbook', isbn: '978-969-001-005-9' },
    { title: 'Islamic Studies', author: 'PTB', category: 'Textbook', isbn: '978-969-001-006-6' },
    { title: 'Biology for Secondary Classes', author: 'PTB', category: 'Textbook', isbn: '978-969-001-007-3' },
  ]
  const books = []
  for (const b of BOOKS) {
    const copies = randInt(4, 12)
    books.push(
      await prisma.book.create({
        data: {
          ...b,
          publisher: rand(['PTB', 'Oxford', 'Cambridge', 'Local Press']),
          totalCopies: copies,
          availableCopies: copies,
          shelfNo: `${rand(['A', 'B', 'C'])}-${randInt(1, 12)}`,
        },
      }),
    )
  }

  // a few issued books
  for (const student of students.slice(0, 12)) {
    const book = rand(books)
    await prisma.bookIssue.create({
      data: {
        bookId: book.id,
        studentId: student.id,
        dueDate: new Date(Date.now() + randInt(3, 20) * 86_400_000),
        status: 'ISSUED',
        issuedById: teachers[0]!.userId,
      },
    })
    await prisma.book.update({
      where: { id: book.id },
      data: { availableCopies: { decrement: 1 } },
    })
  }

  // ── transport ────────────────────────────────────────────
  console.log('  • transport')
  const vehicles = []
  for (let i = 1; i <= 4; i++) {
    vehicles.push(
      await prisma.vehicle.create({
        data: {
          registrationNo: `LEB-${1000 + i * 137}`,
          model: rand(['Toyota Hiace', 'Suzuki Bolan', 'Hino Bus', 'Isuzu Mini Bus']),
          capacity: randInt(20, 45),
          driverName: `${rand(FIRST_MALE)} ${rand(LAST_NAMES)}`,
          driverPhone: phone(),
          conductorName: `${rand(FIRST_MALE)} ${rand(LAST_NAMES)}`,
          status: 'ACTIVE',
          lastServiceAt: date(2025, randInt(6, 11), randInt(1, 28)),
        },
      }),
    )
  }

  const ROUTES = [
    { name: 'Route 01 — DHA / Gulberg', start: 'DHA Phase 5', end: 'School', fee: 8500 },
    { name: 'Route 02 — Model Town / Garden Town', start: 'Model Town', end: 'School', fee: 7500 },
    { name: 'Route 03 — Johar Town / Wapda Town', start: 'Johar Town', end: 'School', fee: 8000 },
    { name: 'Route 04 — Cantt / Saddar', start: 'Cantt', end: 'School', fee: 9000 },
  ]
  for (let i = 0; i < ROUTES.length; i++) {
    const r = ROUTES[i]!
    const route = await prisma.transportRoute.create({
      data: {
        name: r.name,
        startPoint: r.start,
        endPoint: r.end,
        distanceKm: randInt(8, 22),
        monthlyFee: r.fee,
        vehicleId: vehicles[i % vehicles.length]!.id,
        isActive: true,
        stops: [
          { name: r.start, time: '06:45' },
          { name: 'Mid Stop', time: '07:05' },
          { name: r.end, time: '07:30' },
        ],
      },
    })
    for (const student of students.slice(i * 6, i * 6 + 6)) {
      await prisma.studentRoute.create({ data: { studentId: student.id, routeId: route.id } }).catch(() => undefined)
    }
  }

  // ── hostel ───────────────────────────────────────────────
  console.log('  • hostel')
  const rooms = []
  for (const block of ['A', 'B']) {
    for (let n = 1; n <= 6; n++) {
      rooms.push(
        await prisma.hostelRoom.create({
          data: {
            block,
            roomNo: `${block}-${String(n).padStart(2, '0')}`,
            type: n <= 2 ? 'SINGLE' : n <= 4 ? 'DOUBLE' : 'TRIPLE',
            capacity: n <= 2 ? 1 : n <= 4 ? 2 : 3,
            monthlyFee: n <= 2 ? 18000 : n <= 4 ? 12000 : 9000,
            status: 'AVAILABLE',
          },
        }),
      )
    }
  }
  for (let i = 0; i < 8; i++) {
    const room = rooms[i]!
    await prisma.hostelAllocation.create({
      data: { roomId: room.id, studentId: students[students.length - 1 - i]!.id },
    })
    await prisma.hostelRoom.update({
      where: { id: room.id },
      data: { occupied: { increment: 1 } },
    })
  }

  // ── inventory ────────────────────────────────────────────
  console.log('  • inventory')
  const ITEMS = [
    { name: 'Student Desk', category: 'Furniture', qty: 320, min: 50, price: 8500 },
    { name: 'Classroom Chair', category: 'Furniture', qty: 340, min: 50, price: 3200 },
    { name: 'Whiteboard 6x4', category: 'Furniture', qty: 42, min: 10, price: 12500 },
    { name: 'Projector', category: 'Electronics', qty: 8, min: 4, price: 85000 },
    { name: 'Desktop Computer', category: 'IT', qty: 46, min: 10, price: 62000 },
    { name: 'Microscope', category: 'Lab Equipment', qty: 30, min: 10, price: 18000 },
    { name: 'Chemistry Lab Kit', category: 'Lab Equipment', qty: 24, min: 8, price: 22000 },
    { name: 'Cricket Bat', category: 'Sports', qty: 18, min: 6, price: 4500 },
    { name: 'Football', category: 'Sports', qty: 22, min: 8, price: 2800 },
    { name: 'First Aid Box', category: 'Medical', qty: 12, min: 5, price: 3500 },
    { name: 'Printer (Laser)', category: 'IT', qty: 6, min: 2, price: 42000 },
    { name: 'Notice Board', category: 'Furniture', qty: 15, min: 4, price: 7500 },
  ]
  for (let i = 0; i < ITEMS.length; i++) {
    const item = ITEMS[i]!
    await prisma.inventoryItem.create({
      data: {
        name: item.name,
        code: `INV-${String(i + 1).padStart(4, '0')}`,
        category: item.category,
        quantity: item.qty,
        minQuantity: item.min,
        unitPrice: item.price,
        location: rand(['Main Store', 'Lab Block', 'Admin Block', 'Sports Room']),
        supplier: rand(['Local Supplier', 'Tech Traders', 'Furniture Mart', 'Lab Solutions']),
        condition: 'GOOD',
        purchasedAt: date(2025, randInt(1, 10), randInt(1, 28)),
      },
    })
  }

  // ── payroll (last 3 months) ──────────────────────────────
  console.log('  • payroll')
  const MONTHS = ['2025-09', '2025-10', '2025-11']
  for (const period of MONTHS) {
    for (const t of teachers) {
      await prisma.payroll.create({
        data: {
          teacherId: t.id,
          period,
          baseSalary: t.baseSalary,
          allowances: Math.round(t.baseSalary * 0.15),
          deductions: Math.round(t.baseSalary * 0.08),
          netPay: Math.round(t.baseSalary * 1.07),
          status: period === '2025-11' ? 'PENDING' : 'PAID',
          paidAt: period === '2025-11' ? null : date(2025, Number(period.slice(5, 7)), 28),
        },
      })
    }
    for (const s of staffMembers) {
      await prisma.payroll
        .create({
          data: {
            staffId: s.id,
            period,
            baseSalary: 50000,
            allowances: 7500,
            deductions: 4000,
            netPay: 53500,
            status: period === '2025-11' ? 'PENDING' : 'PAID',
            paidAt: period === '2025-11' ? null : date(2025, Number(period.slice(5, 7)), 28),
          },
        })
        .catch(() => undefined)
    }
  }

  // ── notifications ────────────────────────────────────────
  console.log('  • notifications')
  await prisma.notification.createMany({
    data: [
      {
        title: 'Parent-Teacher Meeting',
        body: 'The PTM for all classes will be held on Saturday, 6 December 2025 from 9:00 AM to 1:00 PM. Attendance is mandatory for at least one guardian per student.',
        audience: 'PARENTS',
      },
      {
        title: 'Midterm Results Published',
        body: 'Midterm 2025 results are now available on the student portal. Please review the report card and contact the class teacher for any queries.',
        audience: 'ALL',
      },
      {
        title: 'Winter Vacation',
        body: 'The school will remain closed from 20 December 2025 to 5 January 2026. Classes resume on 6 January 2026.',
        audience: 'ALL',
      },
      {
        title: 'Fee Payment Reminder',
        body: 'November 2025 tuition fees were due on 10 November. Please clear any outstanding dues to avoid a late fee surcharge.',
        audience: 'PARENTS',
      },
      {
        title: 'Annual Sports Day',
        body: 'Annual Sports Day will take place on 15 February 2026 at the school ground. All students are encouraged to participate.',
        audience: 'STUDENTS',
      },
    ],
  })

  // ── admin & demo accounts ────────────────────────────────
  console.log('  • admin account')
  await prisma.user.create({
    data: {
      email: 'admin@ravischool.edu.pk',
      passwordHash,
      role: Role.ADMIN,
      name: 'Faisal Iqbal',
      phone: phone(),
    },
  })

  // ── summary ──────────────────────────────────────────────
  const counts = {
    users: await prisma.user.count(),
    students: await prisma.student.count(),
    teachers: await prisma.teacher.count(),
    classes: await prisma.class.count(),
    sections: await prisma.section.count(),
    subjects: await prisma.subject.count(),
    attendance: await prisma.attendance.count(),
    exams: await prisma.exam.count(),
    results: await prisma.examResult.count(),
    invoices: await prisma.invoice.count(),
    books: await prisma.book.count(),
    routes: await prisma.transportRoute.count(),
    rooms: await prisma.hostelRoom.count(),
    inventory: await prisma.inventoryItem.count(),
    payroll: await prisma.payroll.count(),
    notifications: await prisma.notification.count(),
  }

  console.log('\n✅ Seed complete — Ravi International School\n')
  for (const [key, value] of Object.entries(counts)) {
    console.log(`  ${key.padEnd(14)} ${String(value).padStart(5)}`)
  }

  console.log('\n  Demo logins (password: ' + DEMO_PASSWORD + ')')
  console.log('  ┌──────────┬──────────────────────────────────┐')
  console.log('  │ Admin    │ admin@ravischool.edu.pk          │')
  console.log('  │ Teacher  │ ahmed.1@ravischool.edu.pk        │')
  console.log('  │ Student  │ student@ravischool.edu.pk        │')
  console.log('  │ Parent   │ parent@ravischool.edu.pk         │')
  console.log('  └──────────┴──────────────────────────────────┘\n')
}

main()
  .catch((err) => {
    console.error('\n✗ Seed failed:\n', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
