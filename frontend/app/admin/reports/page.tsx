"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Download,
  FileDown,
  Loader2,
  Calendar,
  FileText,
  Users,
  Wallet,
} from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import {
  downloadReportCsv,
  downloadReportPdf,
  feeTotals,
  useAttendanceReport,
  useEnrolmentReport,
  useFeeReport,
  usePerformanceReport,
  type ReportType,
} from "@/lib/hooks/use-reports"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const money = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(2)}M`
    : value >= 10_000
      ? `${Math.round(value / 1000)}K`
      : value.toLocaleString("en-GB")

const rateTone = (rate: number | null) =>
  rate === null
    ? "text-muted-foreground"
    : rate >= 90
      ? "text-emerald-600"
      : rate >= 75
        ? "text-amber-600"
        : "text-rose-600"

export default function AdminReportsPage() {
  const { ready } = useRequireRole("ADMIN")
  const [days, setDays] = useState(30)
  const [exporting, setExporting] = useState<ReportType | null>(null)

  const fees = useFeeReport()
  const attendance = useAttendanceReport(days)
  const performance = usePerformanceReport()
  const enrolment = useEnrolmentReport()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const totals = feeTotals(fees.rows)
  const enrolmentTotals = enrolment.rows.reduce(
    (acc, row) => ({
      students: acc.students + row.students,
      capacity: acc.capacity + row.capacity,
      sections: acc.sections + row.sections,
    }),
    { students: 0, capacity: 0, sections: 0 },
  )

  const handleExport = async (type: ReportType, format: "csv" | "pdf" = "csv") => {
    setExporting(type)
    try {
      const filename =
        format === "pdf" ? await downloadReportPdf(type, days) : await downloadReportCsv(type, days)
      toast.success(`${format.toUpperCase()} downloaded`, { description: filename })
    } catch {
      toast.error("Could not download this report")
    } finally {
      setExporting(null)
    }
  }

  const cards = [
    {
      label: "Fees billed",
      value: `PKR ${money(totals.billed)}`,
      hint: `${totals.collectionRate ?? 0}% collected`,
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      label: "Outstanding",
      value: `PKR ${money(totals.outstanding)}`,
      hint: `${totals.overdue} overdue invoices`,
      icon: FileText,
      tone: "bg-rose-50 text-rose-600",
    },
    {
      label: `Attendance (${days}d)`,
      value:
        attendance.rows.length === 0
          ? "—"
          : `${Math.round(
              (attendance.rows.reduce((sum, row) => sum + (row.rate ?? 0), 0) / attendance.rows.length) * 10,
            ) / 10}%`,
      hint: `${attendance.rows.length} sections`,
      icon: Calendar,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      label: "Enrolment",
      value: enrolmentTotals.students,
      hint: `${enrolmentTotals.capacity} seats across ${enrolmentTotals.sections} sections`,
      icon: Users,
      tone: "bg-emerald-50 text-emerald-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Reports &amp; analytics</h1>
              <p className="text-muted-foreground">Live figures — every number is computed on read</p>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="report-days" className="text-sm text-muted-foreground">
                Attendance window
              </label>
              <select
                id="report-days"
                className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                value={days}
                onChange={(event) => setDays(Number(event.target.value))}
              >
                {[7, 30, 90, 180].map((value) => (
                  <option key={value} value={value}>
                    {value} days
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", card.tone)}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{card.label}</p>
                    <p className="text-xl font-bold">{card.value}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{card.hint}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="fees">
            <TabsList className="flex-wrap">
              <TabsTrigger value="fees">Fees by class</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="enrolment">Enrolment</TabsTrigger>
            </TabsList>

            {/* ── Fees ─────────────────────────────────────── */}
            <TabsContent value="fees" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">Fee collection by class</CardTitle>
                    <p className="text-sm text-muted-foreground">Billed vs collected per grade</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("fees", "csv")}
                      disabled={exporting === "fees"}
                    >
                      {exporting === "fees" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-4 w-4" />
                      )}
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("fees", "pdf")}
                      disabled={exporting === "fees"}
                    >
                      {exporting === "fees" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-1.5 h-4 w-4" />
                      )}
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {fees.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : fees.rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No invoices raised yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="py-2">Class</th>
                            <th className="py-2 text-right">Students</th>
                            <th className="py-2 text-right">Invoices</th>
                            <th className="py-2 text-right">Billed</th>
                            <th className="py-2 text-right">Paid</th>
                            <th className="py-2 text-right">Outstanding</th>
                            <th className="w-32 py-2 pl-4">Collected</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fees.rows.map((row) => (
                            <tr key={row.classId} className="border-b last:border-0">
                              <td className="py-2 font-medium">{row.className}</td>
                              <td className="py-2 text-right">{row.students}</td>
                              <td className="py-2 text-right">{row.invoices}</td>
                              <td className="py-2 text-right">{money(row.billed)}</td>
                              <td className="py-2 text-right text-emerald-600">{money(row.paid)}</td>
                              <td className="py-2 text-right">
                                <span className={row.outstanding > 0 ? "text-rose-600" : "text-muted-foreground"}>
                                  {money(row.outstanding)}
                                </span>
                              </td>
                              <td className="py-2 pl-4">
                                <div className="flex items-center gap-2">
                                  <Progress value={row.collectionRate ?? 0} className="h-1.5 w-16" />
                                  <span className="text-xs">{row.collectionRate ?? 0}%</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Attendance ───────────────────────────────── */}
            <TabsContent value="attendance" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">Attendance by section</CardTitle>
                    <p className="text-sm text-muted-foreground">Last {days} days · present + late count as attended</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("attendance", "csv")}
                      disabled={exporting === "attendance"}
                    >
                      {exporting === "attendance" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-4 w-4" />
                      )}
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("attendance", "pdf")}
                      disabled={exporting === "attendance"}
                    >
                      {exporting === "attendance" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-1.5 h-4 w-4" />
                      )}
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {attendance.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : attendance.rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No sections found.</p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {attendance.rows.map((row) => (
                        <div key={row.sectionId} className="rounded-lg border p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">
                              {row.className}-{row.sectionName}
                            </p>
                            <span className={cn("text-lg font-bold", rateTone(row.rate))}>
                              {row.rate === null ? "—" : `${row.rate}%`}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {row.students} students · {row.marked} marks
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                            <Badge variant="secondary">present {row.present}</Badge>
                            <Badge variant="outline">late {row.late}</Badge>
                            <Badge variant="outline" className="text-rose-600">
                              absent {row.absent}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Performance ──────────────────────────────── */}
            <TabsContent value="performance" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">Exam performance</CardTitle>
                    <p className="text-sm text-muted-foreground">Latest completed and published exams</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("performance", "csv")}
                      disabled={exporting === "performance"}
                    >
                      {exporting === "performance" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-4 w-4" />
                      )}
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("performance", "pdf")}
                      disabled={exporting === "performance"}
                    >
                      {exporting === "performance" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-1.5 h-4 w-4" />
                      )}
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {performance.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : performance.rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No completed or published exams yet.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[760px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="py-2">Exam</th>
                            <th className="py-2">Class</th>
                            <th className="py-2">Subject</th>
                            <th className="py-2 text-right">Results</th>
                            <th className="py-2 text-right">Average</th>
                            <th className="py-2 text-right">High</th>
                            <th className="py-2 text-right">Low</th>
                            <th className="py-2 text-right">Pass</th>
                          </tr>
                        </thead>
                        <tbody>
                          {performance.rows.map((row) => (
                            <tr key={`${row.classId}-${row.subjectId}-${row.examDate}`} className="border-b last:border-0">
                              <td className="max-w-[220px] truncate py-2 font-medium">{row.examTitle}</td>
                              <td className="py-2">{row.className}</td>
                              <td className="py-2">{row.subjectName}</td>
                              <td className="py-2 text-right">{row.results}</td>
                              <td className="py-2 text-right font-medium">{row.average ?? "—"}</td>
                              <td className="py-2 text-right text-emerald-600">{row.highest ?? "—"}</td>
                              <td className="py-2 text-right text-rose-600">{row.lowest ?? "—"}</td>
                              <td className={cn("py-2 text-right font-medium", rateTone(row.passRate))}>
                                {row.passRate === null ? "—" : `${row.passRate}%`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Enrolment ────────────────────────────────── */}
            <TabsContent value="enrolment" className="mt-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">Enrolment &amp; capacity</CardTitle>
                    <p className="text-sm text-muted-foreground">Seats used per class, with gender split</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("enrolment", "csv")}
                      disabled={exporting === "enrolment"}
                    >
                      {exporting === "enrolment" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="mr-1.5 h-4 w-4" />
                      )}
                      CSV
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExport("enrolment", "pdf")}
                      disabled={exporting === "enrolment"}
                    >
                      {exporting === "enrolment" ? (
                        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                      ) : (
                        <FileDown className="mr-1.5 h-4 w-4" />
                      )}
                      PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {enrolment.isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : enrolment.rows.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">No classes found.</p>
                  ) : (
                    <div className="space-y-3">
                      {enrolment.rows.map((row) => (
                        <div key={row.classId} className="rounded-lg border p-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{row.className}</p>
                              <p className="text-xs text-muted-foreground">
                                {row.sections} sections · {row.students}/{row.capacity} seats
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">boys {row.genderSplit.male}</Badge>
                              <Badge variant="secondary">girls {row.genderSplit.female}</Badge>
                              <span className={cn("text-sm font-semibold", rateTone(row.utilisation))}>
                                {row.utilisation === null ? "—" : `${row.utilisation}%`}
                              </span>
                            </div>
                          </div>
                          <Progress value={row.utilisation ?? 0} className="mt-2 h-1.5" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
