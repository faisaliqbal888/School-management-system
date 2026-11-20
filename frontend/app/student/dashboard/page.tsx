"use client"

import Link from "next/link"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { TodayLessons } from "@/components/dashboard/today-lessons"
import { ResultList } from "@/components/dashboard/result-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, BookOpen, CalendarDays, ClipboardCheck, Loader2, Wallet } from "lucide-react"
import { money, useDashboardSummary } from "@/lib/hooks/use-dashboard"

export default function StudentDashboard() {
  const { user } = useAuth()
  const { ready } = useRequireRole("STUDENT")
  const { summary, isLoading, error } = useDashboardSummary()

  if (!ready) return <FullPageLoader />

  const learner = summary?.role === "STUDENT" ? summary : undefined
  const me = learner?.students[0]
  const attendanceToday = learner?.attendance.today
  const fees = learner?.fees
  const average =
    learner && learner.results.length > 0
      ? Math.round(
          learner.results.reduce((sum, result) => sum + (result.percent ?? 0), 0) / learner.results.length,
        )
      : null

  const stats = [
    {
      title: "Attendance today",
      value: attendanceToday?.rate != null ? `${attendanceToday.rate}%` : "—",
      hint: attendanceToday ? "marked" : "Not marked yet",
      icon: ClipboardCheck,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      title: "Average score",
      value: average !== null ? `${average}%` : "—",
      hint: `${learner?.results.length ?? 0} published results`,
      icon: BookOpen,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Lessons today",
      value: learner?.today.lessons.length ?? "—",
      hint: learner?.today.day.toLowerCase(),
      icon: CalendarDays,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      title: "Fee balance",
      value: fees ? `PKR ${money(fees.outstanding)}` : "—",
      hint: fees?.overdue ? `${fees.overdue} overdue` : "all clear",
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <StudentHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground">
                {me ? `${me.className}-${me.sectionName}` : user?.class || "—"} | Roll No:{" "}
                {me?.rollNo ?? user?.rollNo ?? "—"} | Admission: {me?.admissionNo ?? user?.admissionNo ?? "—"}
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link href="/student/results">View full report card</Link>
            </Button>
          </div>

          {error ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="font-medium">Could not load your dashboard</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <StatsCards stats={stats} isLoading={isLoading} />

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <AttendanceChart
                    trend={learner?.attendance.trend}
                    compact
                    title="My attendance — last 7 days"
                    description="Days where your teacher marked the register"
                  />
                  <ResultList results={learner?.results} />
                </div>

                <div className="space-y-6">
                  <TodayLessons today={learner?.today} showTeacher title="My classes today" />

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>Fees</span>
                        <Badge variant={fees?.outstanding ? "destructive" : "secondary"}>
                          {fees?.outstanding ? "Due" : "Clear"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fees ? (
                        <>
                          <p className="text-2xl font-bold">PKR {money(fees.outstanding)}</p>
                          <p className="text-xs text-muted-foreground">outstanding balance</p>
                          <Progress value={fees.collectionRate ?? 0} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            PKR {money(fees.paid)} paid of PKR {money(fees.billed)}
                          </p>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link href="/student/fees">View invoices</Link>
                          </Button>
                        </>
                      ) : (
                        <p className="py-3 text-sm text-muted-foreground">No invoices raised for you yet.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
