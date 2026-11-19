import { NextResponse } from 'next/server'

// Mock student details with comprehensive data
const studentDetails: Record<string, any> = {
  '1': {
    id: 1,
    name: 'Ahmed Ali',
    admissionNo: 'STU001',
    class: 8,
    section: 'A',
    email: 'ahmed.ali@example.com',
    phone: '+923001234567',
    dateOfBirth: 'Jan 15, 2010',
    address: '123 Main Street, Karachi',
    parentName: 'Mr. Ali Ahmed',
    avatar: '/avatars/student1.jpg',
    status: 'Active',
    academics: {
      overallGrade: '85%',
      classRank: 3,
      gradeLevel: 'A',
      subjects: [
        { subject: 'Mathematics', score: 92 },
        { subject: 'Science', score: 88 },
        { subject: 'English', score: 85 },
        { subject: 'History', score: 78 },
        { subject: 'Computer Science', score: 95 },
      ]
    },
    results: [
      { exam: 'Midterm - Mathematics', score: 92, date: 'Nov 15, 2024', status: 'Passed' },
      { exam: 'Midterm - Science', score: 88, date: 'Nov 16, 2024', status: 'Passed' },
      { exam: 'Midterm - English', score: 85, date: 'Nov 17, 2024', status: 'Passed' },
      { exam: 'Unit Test 1 - History', score: 78, date: 'Nov 10, 2024', status: 'Passed' },
      { exam: 'Unit Test 2 - CS', score: 95, date: 'Nov 12, 2024', status: 'Passed' },
    ],
    achievements: [
      { title: 'Science Fair Winner', date: 'Oct 2024' },
      { title: 'Debate Competition - 1st Place', date: 'Sep 2024' },
      { title: 'Perfect Attendance Award', date: 'Aug 2024' },
    ],
    fees: {
      totalPaid: '$4,500',
      pending: '$1,500',
      totalFee: '$6,000',
      recentPayments: [
        { date: 'Dec 1, 2025', amount: '$1,500', status: 'Paid', type: 'Tuition Fee' },
        { date: 'Nov 1, 2025', amount: '$1,500', status: 'Paid', type: 'Tuition Fee' },
        { date: 'Oct 1, 2025', amount: '$1,500', status: 'Paid', type: 'Tuition Fee' },
      ]
    },
    attendance: {
      rate: '94%',
      presentDays: 156,
      absentDays: 10,
      lateArrivals: 5,
    },
    documents: [
      { name: 'Class 8 Result Card', date: 'Dec 2024' },
      { name: 'Transfer Certificate', date: 'Jan 2024' },
      { name: 'Character Certificate', date: 'Dec 2023' },
      { name: 'Admission Form', date: 'Jan 2023' },
    ],
    notes: [
      { author: 'Class Teacher', date: 'Dec 8, 2024', note: 'Excellent performance in this semester. Keep it up!' },
      { author: 'Principal', date: 'Nov 20, 2024', note: 'Student shows leadership qualities. Encourage participation in school activities.' },
      { author: 'Counselor', date: 'Oct 15, 2024', note: 'Student is well-adjusted and maintaining good peer relationships.' },
    ]
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const student = studentDetails[id]

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  return NextResponse.json(student)
}
