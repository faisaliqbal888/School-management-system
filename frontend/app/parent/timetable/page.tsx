"use client"

import { useState } from "react"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, CalendarDays, User } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useStudents } from "@/lib/hooks/use-students"
import { useMyTimetable, type SlotRow } from "@/lib/hooks/use-timetable"
import { WeeklyTimetable } from "@/components/timetable/weekly-timetable"
import { UpcomingClasses } from "@/components/timetable/upcoming-classes"
import { cn } from "@/lib/utils"

export default function ParentTimetablePage() {
  const { ready } = useRequireRole("PARENT")
  const { students, isLoading: childrenLoading } = useStudents({ limit: 20 })
  const { grid, isLoading, error } = useMyTimetable()
  const [activeChild, setActiveChild] = useState<string | null>(null)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const child = students.find((s) => s.id === activeChild) ?? students[0]

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <CalendarDays className="h-7 w-7" /> Timetable
            </h1>
            <p className="mt-1 text-rose-100">
              {grid?.scope.className
                ? `${grid.scope.className}${grid.scope.sectionName ? ` – Section ${grid.scope.sectionName}` : ""} · ${grid.slots.length} lessons a week`
                : "Your child’s weekly class schedule"}
            </p>
          </div>

          {childrenLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : students.length > 1 ? (
            <div className="flex flex-wrap gap-2">
              {students.map((student) => (
                <Button
                  key={student.id}
                  variant={student.id === child?.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveChild(student.id)}
                  className={cn("gap-2")}
                >
                  <User className="h-3.5 w-3.5" />
                  {student.name}
                  <Badge variant="secondary" className="ml-1">
                    {student.className}
                    {student.sectionName ? `-${student.sectionName}` : ""}
                  </Badge>
                </Button>
              ))}
            </div>
          ) : null}

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Could not load the timetable. Please try again later.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Weekly schedule</CardTitle>
                  <CardDescription>
                    {child ? `${child.name}’s lessons this week` : "Monday to Friday schedule"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WeeklyTimetable
                    grid={grid}
                    isLoading={isLoading}
                    emptyHint="No timetable has been published for this section yet."
                  />
                </CardContent>
              </Card>

              <div className="space-y-6">
                <UpcomingClasses title="Today at school" />
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Subjects this week</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {[...new Set((grid?.slots ?? []).map((s: SlotRow) => s.subjectName))].map((name: string) => (
                      <Badge key={name} variant="secondary">
                        {name}
                      </Badge>
                    ))}
                    {(grid?.slots.length ?? 0) === 0 && !isLoading && (
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
