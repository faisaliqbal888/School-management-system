"use client"

import { useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { AttendanceReport, MonthlyTrend } from "@/components/attendance/attendance-report"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Loader2,
  Users,
  XCircle,
} from "lucide-react"
import { useAttendanceSummary } from "@/lib/hooks/use-attendance"
import { useStudents } from "@/lib/hooks/use-students"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function ParentAttendancePage() {
  const { ready } = useRequireRole("PARENT")
  const { students, isLoading: childrenLoading } = useStudents({ limit: 20 })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const childId = selectedId ?? students[0]?.id ?? null
  const selected = students.find((s) => s.id === childId) ?? students[0]

  const { summary, isLoading: summaryLoading, error } = useAttendanceSummary(
    childId ? { studentId: childId } : {},
  )

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="mt-1 text-rose-100">Daily and monthly attendance for your children.</p>
          </div>

          {childrenLoading ? (
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <ClipboardCheck className="h-7 w-7" />
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No children are linked to this account yet. Please contact the school office.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* child switcher */}
              {students.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {students.map((child) => (
                    <button key={child.id} type="button" onClick={() => setSelectedId(child.id)}>
                      <Badge
                        variant={child.id === childId ? "default" : "outline"}
                        className="cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-normal"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {child.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Showing attendance for{" "}
                <span className="font-semibold text-foreground">{selected?.name}</span>
                {selected?.className ? ` · ${selected.className}` : ""}
                {selected?.sectionName ? `-${selected.sectionName}` : ""}
              </p>

              {error && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </CardContent>
                </Card>
              )}

              {summaryLoading || !summary ? (
                <div className="grid gap-4 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <Card className="overflow-hidden border-0 bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-rose-100">Attendance rate</p>
                          <p className="mt-1 text-4xl font-bold">
                            {summary.rate !== null ? `${summary.rate}%` : "—"}
                          </p>
                          <p className="mt-1 text-xs text-rose-100">
                            {formatDate(summary.from)} → {formatDate(summary.to)} ·{" "}
                            {summary.totalDays} recorded days
                          </p>
                        </div>
                        <div className="min-w-[220px] flex-1">
                          <Progress
                            value={summary.rate ?? 0}
                            className="h-2.5 bg-white/20 [&>div]:bg-white"
                          />
                          <p className="mt-2 text-xs text-rose-100">
                            {summary.present} present · {summary.late} late · {summary.absent} absent
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Stat label="Present" value={summary.present} icon={CheckCircle2} tone="emerald" />
                    <Stat label="Late" value={summary.late} icon={Clock} tone="amber" />
                    <Stat label="Absent" value={summary.absent} icon={XCircle} tone="red" />
                    <Stat label="Excused" value={summary.excused} icon={CalendarDays} tone="blue" />
                  </div>

                  <MonthlyTrend monthly={summary.monthly} />
                </>
              )}

              <div>
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Daily records</h2>
                <AttendanceReport hideStudentColumn showSectionFilter={false} />
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function Stat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ElementType
  tone: "emerald" | "amber" | "red" | "blue"
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  }
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}
