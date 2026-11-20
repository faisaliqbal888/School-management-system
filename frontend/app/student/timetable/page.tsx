"use client"

import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CalendarDays } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useMyTimetable, type SlotRow } from "@/lib/hooks/use-timetable"
import { WeeklyTimetable } from "@/components/timetable/weekly-timetable"
import { UpcomingClasses } from "@/components/timetable/upcoming-classes"

export default function StudentTimetablePage() {
  const { ready } = useRequireRole("STUDENT")
  const { grid, isLoading, error } = useMyTimetable()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const lessons = grid?.slots.length ?? 0
  const subjects = new Set((grid?.slots ?? []).map((s: SlotRow) => s.subjectId)).size

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <StudentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <CalendarDays className="h-7 w-7" /> My Timetable
            </h1>
            <p className="mt-1 text-blue-100">
              {grid?.scope.className
                ? `${grid.scope.className}${grid.scope.sectionName ? ` – Section ${grid.scope.sectionName}` : ""} · ${lessons} lessons a week · ${subjects} subjects`
                : "Your weekly class schedule"}
            </p>
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
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div>
                    <CardTitle className="text-base">Weekly schedule</CardTitle>
                    <CardDescription>Monday to Friday, period by period</CardDescription>
                  </div>
                  {grid?.slots.some((s: SlotRow) => s.isCurrent) && <Badge>Class in progress</Badge>}
                </CardHeader>
                <CardContent>
                  <WeeklyTimetable
                    grid={grid}
                    isLoading={isLoading}
                    emptyHint="No timetable published for your section yet."
                  />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <UpcomingClasses />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Subjects this week</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {[...new Set((grid?.slots ?? []).map((s: SlotRow) => s.subjectName))].map((name) => (
                      <Badge key={name} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                    {lessons === 0 && !isLoading && (
                      <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
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
