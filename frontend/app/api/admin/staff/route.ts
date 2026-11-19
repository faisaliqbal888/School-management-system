import { NextResponse } from 'next/server'

const staff = [
  { id: 1, name: 'Ahmed Khan', position: 'Principal', department: 'Administration', email: 'ahmed@school.com', salary: '$8,500', status: 'Active' },
  { id: 2, name: 'Fatima Ali', position: 'Senior Teacher', department: 'Mathematics', email: 'fatima@school.com', salary: '$4,200', status: 'Active' },
  { id: 3, name: 'Hassan Khan', position: 'Teacher', department: 'Science', email: 'hassan@school.com', salary: '$3,500', status: 'Active' },
  { id: 4, name: 'Sara Ahmed', position: 'Librarian', department: 'Library', email: 'sara@school.com', salary: '$2,800', status: 'On Leave' },
  { id: 5, name: 'Ali Hassan', position: 'IT Staff', department: 'IT', email: 'ali@school.com', salary: '$3,200', status: 'Active' },
  { id: 6, name: 'Maryam Khan', position: 'Accountant', department: 'Finance', email: 'maryam@school.com', salary: '$3,800', status: 'Active' },
]

export async function GET() {
  return NextResponse.json(staff)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    // In-memory mock: echo back with fake id
    const newItem = { id: Date.now(), ...body }
    // In a real app you'd persist to DB here
    return NextResponse.json(newItem, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
}
