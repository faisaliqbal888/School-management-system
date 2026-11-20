"use client"

import { useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft, ChevronRight, ClipboardList, TrendingUp } from "lucide-react"
import {
  useAttendanceHistory,
  useAttendanceSections,
  type AttendanceStatus,
} from "@/lib/hooks/use-attendance"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<AttendanceStatus, string> = {
  PRESENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ABSENT: "bg-red-50 text-red-700 border-red-200",
  LATE: "bg-amber-50 text-amber-700 border-amber-200",
  EXCUSED: "bg-blue-50 text-blue-700 border-blue-200",
  HOLIDAY: "bg-slate-100 text-slate-600 border-slate-200",
}

interface AttendanceReportProps {
  /** Hide the student column when a single learner is viewing their own history. */
  hideStudentColumn?: boolean
  /** Show the section filter (staff only). */
  showSectionFilter?: boolean
}

export function AttendanceReport({
  hideStudentColumn = false,
  showSectionFilter = true,
}: AttendanceReportProps) {
  const [sectionId, setSectionId] = useState("all")
  const [status, setStatus] = useState<AttendanceStatus | "all">("all")
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [page, setPage] = useState(1)

  const { sections } = useAttendanceSections(showSectionFilter)

  const filters = useMemo(
    () => ({
      page,
      limit: 15,
      ...(sectionId !== "all" ? { sectionId } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }),
    [page, sectionId, status, from, to],
  )

  const { rows, meta, isLoading, error } = useAttendanceHistory(filters)

  const resetPage = () => setPage(1)

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
          {showSectionFilter && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Section</label>
              <Select
                value={sectionId}
                onValueChange={(v) => {
                  setSectionId(v)
                  resetPage()
                }}
              >
                <SelectTrigger className="w-full lg:w-52">
                  <SelectValue placeholder="All sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.className} — {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Status</label>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as AttendanceStatus | "all")
                resetPage()
              }}
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="PRESENT">Present</SelectItem>
                <SelectItem value="LATE">Late</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
                <SelectItem value="EXCUSED">Excused</SelectItem>
                <SelectItem value="HOLIDAY">Holiday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">From</label>
            <Input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                resetPage()
              }}
              className="w-full lg:w-40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">To</label>
            <Input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                resetPage()
              }}
              className="w-full lg:w-40"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center gap-2 pb-3">
          <ClipboardList className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Attendance records</CardTitle>
          {meta && (
            <span className="ml-auto text-xs text-muted-foreground">
              {meta.total.toLocaleString("en-PK")} record{meta.total === 1 ? "" : "s"}
            </span>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="p-6 text-center text-sm text-destructive">{error}</p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No attendance records for these filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    {!hideStudentColumn && <th className="px-4 py-2.5 font-medium">Student</th>}
                    <th className="px-4 py-2.5 font-medium">Class</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                      <td className="whitespace-nowrap px-4 py-2.5">{formatDate(r.date)}</td>
                      {!hideStudentColumn && (
                        <td className="px-4 py-2.5">
                          <p className="font-medium">{r.studentName}</p>
                          <p className="text-xs text-muted-foreground">{r.admissionNo}</p>
                        </td>
                      )}
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">
                        {r.className}
                        {r.sectionName !== "—" ? ` — ${r.sectionName}` : ""}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge
                          variant="outline"
                          className={cn("text-[10px]", STATUS_STYLES[r.status])}
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate px-4 py-2.5 text-muted-foreground">
                        {r.remarks ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-white p-3">
          <p className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={meta.page <= 1 || isLoading}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
              disabled={meta.page >= meta.totalPages || isLoading}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Monthly trend derived from the summary endpoint — used by student/parent views. */
export function MonthlyTrend({
  monthly,
}: {
  monthly: { month: string; present: number; absent: number; late: number; rate: number | null }[]
}) {
  if (monthly.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No attendance recorded yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <TrendingUp className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Monthly trend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {monthly.map((m) => (
          <div key={m.month}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium">
                {new Date(`${m.month}-01T00:00:00Z`).toLocaleDateString("en-GB", {
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </span>
              <span className="text-muted-foreground">
                {m.present} present · {m.late} late · {m.absent} absent
                {m.rate !== null ? ` · ${m.rate}%` : ""}
              </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full",
                  (m.rate ?? 0) >= 90
                    ? "bg-emerald-500"
                    : (m.rate ?? 0) >= 75
                      ? "bg-amber-500"
                      : "bg-red-500",
                )}
                style={{ width: `${m.rate ?? 0}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
