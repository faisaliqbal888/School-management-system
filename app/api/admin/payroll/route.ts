import { NextResponse } from 'next/server'

const payroll = [
  { month: 'December 2024', base: '$98,400', allowances: '$18,200', deductions: '$12,100', total: '$124,500', status: 'Pending' },
  { month: 'November 2024', base: '$98,400', allowances: '$18,200', deductions: '$12,100', total: '$124,500', status: 'Paid' },
  { month: 'October 2024', base: '$98,400', allowances: '$18,200', deductions: '$12,100', total: '$124,500', status: 'Paid' },
]

export async function GET() {
  return NextResponse.json(payroll)
}
