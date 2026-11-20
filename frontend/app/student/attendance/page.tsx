"use client"

import { useRequireRole } from "@/lib/auth-context"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { AttendanceReport, MonthlyTrend } from "@/components/attendance/attendance-report"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  TrendingUp,
  XCircle,
} from "lucide-react"
import { useAttendanceSummary } from "@/lib/hooks/use-attendance"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function StudentAttendancePage() {
  const { ready } = useRequireRole("STUDENT")
  const { summary, isLoading, error } = useAttendanceSummary()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <StudentHeader />
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
            <p className="text-muted-foreground">
              Your day-by-day record and monthly attendance rate
            </p>
          </div>

          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          ) : summary ? (
            <>
              {/* rate hero */}
              <Card className="overflow-hidden border-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-blue-100">Overall attendance rate</p>
                      <p className="mt-1 text-4xl font-bold">
                        {summary.rate !== null ? `${summary.rate}%` : "—"}
                      </p>
                      <p className="mt-1 text-xs text-blue-100">
                        {formatDate(summary.from)} → {formatDate(summary.to)} ·{" "}
                        {summary.totalDays} recorded days
                      </p>
                    </div>
                    <div className="min-w-[220px] flex-1">
                      <Progress
                        value={summary.rate ?? 0}
                        className="h-2.5 bg-white/20 [&>div]:bg-white"
                      />
                      <p className="mt-2 text-xs text-blue-100">
                        {summary.present} present · {summary.late} late · {summary.absent} absent
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Stat
                  label="Present"
                  value={summary.present}
                  icon={CheckCircle2}
                  tone="emerald"
                  hint="Including late arrivals"
                />
                <Stat label="Late" value={summary.late} icon={Clock} tone="amber" hint="Arrived after start" />
                <Stat label="Absent" value={summary.absent} icon={XCircle} tone="red" hint="Unexcused" />
                <Stat
                  label="Excused"
                  value={summary.excused}
                  icon={CalendarDays}
                  tone="blue"
                  hint="Approved absence"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <MonthlyTrend monthly={summary.monthly} />
                <Card>
                  <CardContent className="space-y-2 p-5">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <p className="text-sm font-semibold">How it&apos;s calculated</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      The rate counts present and late days as attended, over all recorded days
                      (present + late + absent + excused). Holidays are excluded. A rate of 85% or
                      above is considered good standing.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : null}

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Daily records</h2>
            <AttendanceReport hideStudentColumn={false} showSectionFilter={false} />
          </div>
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
  hint,
}: {
  label: string
  value: number
  icon: React.ElementType
  tone: "emerald" | "amber" | "red" | "blue"
  hint: string
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
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}
