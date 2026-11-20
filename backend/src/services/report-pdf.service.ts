import PDFDocument from 'pdfkit'
import type { Role } from '@prisma/client'
import { prisma } from '../config/prisma.js'
import { forbidden } from '../utils/errors.js'
import * as reports from './reports.service.js'

/**
 * PDF rendering for the four admin reports.
 *
 * The PDF and the CSV are built from exactly the same service functions, so a
 * number can never disagree between the two downloads. PDFKit streams into a
 * buffer, which keeps the route handler trivial and the output hostable
 * anywhere (no headless browser, no native binary).
 */

export interface Actor {
  id: string
  role: Role
}

type Column = { header: string; key: string; width: number; align?: 'left' | 'right' }

const PAGE_MARGIN = 36
const HEADER_HEIGHT = 22

/** School identity is read from settings so report headers match the school. */
async function schoolHeader() {
  const rows = await prisma.schoolSetting.findMany({
    where: { key: { in: ['school.name', 'school.address', 'school.phone', 'school.email'] } },
  })
  const map = new Map(rows.map((row) => [row.key, row.value]))
  return {
    name: map.get('school.name') ?? 'School Management System',
    address: map.get('school.address') ?? '',
    phone: map.get('school.phone') ?? '',
    email: map.get('school.email') ?? '',
  }
}

function drawTable(
  doc: PDFKit.PDFDocument,
  columns: Column[],
  rows: Record<string, string | number | null>[],
  startedAt: number,
) {
  const tableLeft = PAGE_MARGIN
  const usableWidth = doc.page.width - PAGE_MARGIN * 2
  const scale = usableWidth / columns.reduce((sum, column) => sum + column.width, 0)
  const widths = columns.map((column) => column.width * scale)

  const drawHeaderRow = (y: number) => {
    doc.rect(tableLeft, y, usableWidth, HEADER_HEIGHT).fill('#1e293b')
    let x = tableLeft
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(8)
    columns.forEach((column, index) => {
      doc.text(column.header, x + 3, y + 7, {
        width: widths[index]! - 6,
        align: column.align ?? 'left',
        lineBreak: false,
      })
      x += widths[index]!
    })
    return y + HEADER_HEIGHT
  }

  doc.font('Helvetica').fontSize(8)
  let y = doc.y + 6
  y = drawHeaderRow(y)

  rows.forEach((row, rowIndex) => {
    if (y + 16 > doc.page.height - PAGE_MARGIN - 20) {
      doc.addPage()
      y = PAGE_MARGIN
      y = drawHeaderRow(y)
      doc.font('Helvetica').fontSize(8)
    }

    if (rowIndex % 2 === 1) {
      doc.rect(tableLeft, y, usableWidth, 16).fill('#f1f5f9')
    }

    let x = tableLeft
    doc.fillColor('#0f172a').font('Helvetica').fontSize(8)
    columns.forEach((column, index) => {
      const raw = row[column.key]
      doc.text(String(raw ?? '—'), x + 3, y + 4, {
        width: widths[index]! - 6,
        align: column.align ?? 'left',
        lineBreak: false,
        ellipsis: true,
      })
      x += widths[index]!
    })
    y += 16
  })

  doc.y = y
  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
  doc
    .fillColor('#64748b')
    .font('Helvetica')
    .fontSize(7)
    .text(
      `Generated ${new Date().toUTCString()} · ${rows.length} row(s) · ${seconds}s`,
      tableLeft,
      doc.page.height - PAGE_MARGIN - 10,
      { width: usableWidth, align: 'left' },
    )
}

function renderReport(
  options: {
    school: Awaited<ReturnType<typeof schoolHeader>>
    title: string
    subtitle: string
    columns: Column[]
    rows: Record<string, string | number | null>[]
  },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now()
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', layout: 'landscape' })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── masthead ─────────────────────────────────────────────
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(16).text(options.school.name, PAGE_MARGIN, PAGE_MARGIN)
    doc.font('Helvetica').fontSize(8).fillColor('#475569')
    const contact = [options.school.address, options.school.phone, options.school.email].filter(Boolean).join(' · ')
    if (contact) doc.text(contact, { width: doc.page.width - PAGE_MARGIN * 2 })

    doc.moveDown(0.6)
    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(12).text(options.title)
    doc.font('Helvetica').fontSize(9).fillColor('#475569').text(options.subtitle)
    doc.moveDown(0.4)

    drawTable(doc, options.columns, options.rows, startedAt)
    doc.end()
  })
}

export interface PdfResult {
  filename: string
  buffer: Buffer
}

/** Renders one of the four reports as a PDF. */
export async function reportPdf(actor: Actor, type: string, days = 30): Promise<PdfResult> {
  if (actor.role !== 'ADMIN') throw forbidden('Only administrators can export reports')

  const school = await schoolHeader()
  const stamp = new Date().toISOString().slice(0, 10)

  if (type === 'fees') {
    const rows = await reports.feeReportByClass(actor)
    return {
      filename: `fees-by-class-${stamp}.pdf`,
      buffer: await renderReport({
        school,
        title: 'Fee collection by class',
        subtitle: 'Invoices raised, amount collected and outstanding balance for the current academic year',
        columns: [
          { header: 'Class', key: 'className', width: 110 },
          { header: 'Students', key: 'students', width: 60, align: 'right' },
          { header: 'Invoices', key: 'invoices', width: 60, align: 'right' },
          { header: 'Billed (PKR)', key: 'billed', width: 90, align: 'right' },
          { header: 'Paid (PKR)', key: 'paid', width: 90, align: 'right' },
          { header: 'Outstanding', key: 'outstanding', width: 90, align: 'right' },
          { header: 'Collection %', key: 'collectionRate', width: 70, align: 'right' },
          { header: 'Overdue', key: 'overdue', width: 60, align: 'right' },
        ],
        rows: rows.map((row) => ({ ...row }) as unknown as Record<string, string | number | null>),
      }),
    }
  }

  if (type === 'attendance') {
    const rows = await reports.attendanceReport(actor, days)
    return {
      filename: `attendance-${days}d-${stamp}.pdf`,
      buffer: await renderReport({
        school,
        title: `Attendance — last ${days} days`,
        subtitle: 'Marked sessions per class section with present, absent and late counts',
        columns: [
          { header: 'Class', key: 'className', width: 100 },
          { header: 'Section', key: 'sectionName', width: 60 },
          { header: 'Students', key: 'students', width: 60, align: 'right' },
          { header: 'Marked', key: 'marked', width: 60, align: 'right' },
          { header: 'Present', key: 'present', width: 60, align: 'right' },
          { header: 'Absent', key: 'absent', width: 60, align: 'right' },
          { header: 'Late', key: 'late', width: 60, align: 'right' },
          { header: 'Rate %', key: 'rate', width: 60, align: 'right' },
        ],
        rows: rows.map((row) => ({ ...row }) as unknown as Record<string, string | number | null>),
      }),
    }
  }

  if (type === 'performance') {
    const rows = await reports.performanceReport(actor)
    return {
      filename: `performance-${stamp}.pdf`,
      buffer: await renderReport({
        school,
        title: 'Academic performance',
        subtitle: 'Published exam results aggregated per class and subject',
        columns: [
          { header: 'Class', key: 'className', width: 90 },
          { header: 'Subject', key: 'subjectName', width: 110 },
          { header: 'Exam', key: 'examTitle', width: 130 },
          { header: 'Date', key: 'examDate', width: 70 },
          { header: 'Results', key: 'results', width: 55, align: 'right' },
          { header: 'Average', key: 'average', width: 60, align: 'right' },
          { header: 'Highest', key: 'highest', width: 60, align: 'right' },
          { header: 'Lowest', key: 'lowest', width: 60, align: 'right' },
          { header: 'Pass %', key: 'passRate', width: 60, align: 'right' },
        ],
        rows: rows.map((row) => ({ ...row, examDate: row.examDate.slice(0, 10) }) as unknown as Record<string, string | number | null>),
      }),
    }
  }

  const rows = await reports.enrolmentReport(actor)
  return {
    filename: `enrolment-${stamp}.pdf`,
    buffer: await renderReport({
      school,
      title: 'Enrolment by class',
      subtitle: 'Seat capacity, utilisation and gender split for every class',
      columns: [
        { header: 'Class', key: 'className', width: 120 },
        { header: 'Sections', key: 'sections', width: 60, align: 'right' },
        { header: 'Capacity', key: 'capacity', width: 60, align: 'right' },
        { header: 'Students', key: 'students', width: 60, align: 'right' },
        { header: 'Utilisation %', key: 'utilisation', width: 80, align: 'right' },
        { header: 'Male', key: 'male', width: 60, align: 'right' },
        { header: 'Female', key: 'female', width: 60, align: 'right' },
        { header: 'Other', key: 'other', width: 60, align: 'right' },
      ],
      rows: rows.map((row) => ({
        className: row.className,
        sections: row.sections,
        capacity: row.capacity,
        students: row.students,
        utilisation: row.utilisation,
        male: row.genderSplit.male,
        female: row.genderSplit.female,
        other: row.genderSplit.other,
      })),
    }),
  }
}
