"use client"

import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CalendarDays, Users, BookOpen, Clock } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useMyTimetable, type SlotRow } from "@/lib/hooks/use-timetable"
import { WeeklyTimetable } from "@/components/timetable/weekly-timetable"
import { UpcomingClasses } from "@/components/timetable/upcoming-classes"

export default function TeacherTimetablePage() {
  const { ready } = useRequireRole("TEACHER")
  const { grid, isLoading, error } = useMyTimetable()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const lessons = grid?.slots ?? []
  const sections = new Set(lessons.map((s: SlotRow) => `${s.className}-${s.sectionName ?? ""}`)).size
  const subjects = new Set(lessons.map((s: SlotRow) => s.subjectId)).size
  const hours = lessons.length * 0.75

  const perSection = new Map<string, number>()
  for (const slot of lessons) {
    const key = `${slot.className}-${slot.sectionName ?? ""}`
    perSection.set(key, (perSection.get(key) ?? 0) + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <CalendarDays className="h-7 w-7" /> My Timetable
            </h1>
            <p className="mt-1 text-emerald-100">
              {grid?.scope.teacherName ? `${grid.scope.teacherName} · ${lessons.length} lessons a week` : "Your teaching schedule"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Lessons / week", value: lessons.length, icon: BookOpen },
              { label: "Sections taught", value: sections, icon: Users },
              { label: "Teaching hours", value: `${hours.toFixed(1)}h`, icon: Clock },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Could not load your timetable. Please try again later.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Weekly schedule</CardTitle>
                  <CardDescription>Every section you teach, in one grid</CardDescription>
                </CardHeader>
                <CardContent>
                  <WeeklyTimetable
                    grid={grid}
                    isLoading={isLoading}
                    emptyHint="You have no lessons assigned yet — contact the admin office."
                  />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <UpcomingClasses showTeacher={false} />

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Periods per section</CardTitle>
                    <CardDescription>{subjects} distinct subjects</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[...perSection.entries()].map(([name, count]) => (
                      <div key={name} className="flex items-center justify-between text-sm">
                        <span className="truncate">{name}</span>
                        <Badge variant="secondary">{count} lessons</Badge>
                      </div>
                    ))}
                    {perSection.size === 0 && !isLoading && (
                      <p className="text-sm text-muted-foreground">Nothing assigned yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
