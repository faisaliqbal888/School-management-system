"use client"

import Link from "next/link"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { TodayLessons } from "@/components/dashboard/today-lessons"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, BookOpen, CalendarDays, ClipboardCheck, Loader2, Users } from "lucide-react"
import { useDashboardSummary } from "@/lib/hooks/use-dashboard"

export default function TeacherDashboard() {
  const { user } = useAuth()
  const { ready } = useRequireRole("TEACHER")
  const { summary, isLoading, error } = useDashboardSummary()

  if (!ready) return <FullPageLoader />

  const teacher = summary?.role === "TEACHER" ? summary : undefined
  const counts = teacher?.counts
  const attendanceToday = teacher?.attendance.today

  const stats = [
    {
      title: "Lessons / week",
      value: counts?.lessons ?? "—",
      hint: `${counts?.subjects ?? 0} subjects`,
      icon: BookOpen,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Students",
      value: counts?.students ?? "—",
      hint: `${counts?.sections ?? 0} sections`,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      title: "Attendance today",
      value: attendanceToday?.rate != null ? `${attendanceToday.rate}%` : "—",
      hint: attendanceToday ? `${attendanceToday.marked} marked` : "Not marked yet",
      icon: ClipboardCheck,
      tone: "bg-amber-50 text-amber-600",
    },
    {
      title: "Upcoming exams",
      value: teacher?.exams.length ?? "—",
      hint: "created by you",
      icon: CalendarDays,
      tone: "bg-violet-50 text-violet-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 p-6">
          <div className="flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.name?.split(" ")[0] ?? "Teacher"}! 👋
              </h1>
              <p className="mt-1 text-emerald-100">
                {teacher?.teacher.designation ?? "Teacher"}
                {teacher?.teacher.department ? ` · ${teacher.teacher.department}` : ""}
                {teacher?.teacher.employeeNo ? ` · ${teacher.teacher.employeeNo}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" asChild>
                <Link href="/teacher/attendance">
                  <ClipboardCheck className="mr-1.5 h-4 w-4" /> Mark attendance
                </Link>
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/teacher/results">
                  <BookOpen className="mr-1.5 h-4 w-4" /> Enter marks
                </Link>
              </Button>
            </div>
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
                    trend={teacher?.attendance.trend}
                    title="Attendance in my sections"
                    description="Present + late across every section you teach"
                  />
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">My sections</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(teacher?.sections.length ?? 0) === 0 ? (
                        <p className="py-4 text-sm text-muted-foreground">
                          No sections are assigned to you yet.
                        </p>
                      ) : (
                        <ul className="divide-y">
                          {teacher?.sections.map((section) => (
                            <li
                              key={section.sectionId}
                              className="flex items-center justify-between py-2.5 text-sm"
                            >
                              <span className="font-medium">
                                {section.className}-{section.sectionName}
                              </span>
                              <Badge variant="secondary">{section.studentCount} students</Badge>
                            </li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <TodayLessons today={teacher?.today} />
                  <UpcomingEvents
                    exams={teacher?.exams}
                    title="Your recent exams"
                    href="/teacher/results"
                  />
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
