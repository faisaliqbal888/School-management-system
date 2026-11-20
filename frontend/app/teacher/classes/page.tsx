"use client"

import Link from "next/link"
import { useMemo } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, ClipboardCheck, Clock, DoorOpen, FileText, Loader2, Users } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useDashboardSummary } from "@/lib/hooks/use-dashboard"
import { useMyTimetable } from "@/lib/hooks/use-timetable"

export default function TeacherClassesPage() {
  const { ready } = useRequireRole("TEACHER")
  const { summary, isLoading } = useDashboardSummary()
  const { grid, isLoading: timetableLoading } = useMyTimetable()

  const teacher = summary?.role === "TEACHER" ? summary : undefined
  const sections = teacher?.sections ?? []
  const slots = grid?.slots ?? []

  const perSection = useMemo(() => {
    const map = new Map<string, { name: string; subject: string; count: number; room: string | null }[]>()
    for (const slot of slots) {
      const key = `${slot.className}-${slot.sectionName ?? ""}`
      const list = map.get(key) ?? []
      const existing = list.find((item) => item.name === slot.subjectName)
      if (existing) existing.count += 1
      else list.push({ name: slot.subjectName, subject: slot.subjectId, count: 1, room: slot.roomNo })
      map.set(key, list)
    }
    return map
  }, [slots])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const busy = isLoading || timetableLoading

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <BookOpen className="h-7 w-7" /> My Classes
            </h1>
            <p className="mt-1 text-emerald-100">
              {teacher
                ? `${teacher.counts.sections} sections · ${teacher.counts.students} students · ${teacher.counts.lessons} lessons a week`
                : "The sections you teach"}
            </p>
          </div>

          {busy ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-64 w-full" />
              ))}
            </div>
          ) : sections.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                <BookOpen className="h-9 w-9 text-muted-foreground/50" />
                <p className="font-medium">No sections assigned</p>
                <p className="text-sm text-muted-foreground">
                  Once the timetable assigns you a class, it will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((section) => {
                const key = `${section.className}-${section.sectionName}`
                const subjects = perSection.get(key) ?? []
                const lessons = subjects.reduce((sum, subject) => sum + subject.count, 0)
                const room = subjects.find((subject) => subject.room)?.room

                return (
                  <Card key={section.sectionId}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-lg">{key}</CardTitle>
                          <CardDescription>{section.studentCount} enrolled students</CardDescription>
                        </div>
                        <Badge variant="secondary" className="shrink-0">
                          {lessons} lessons
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {section.studentCount} students
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lessons} periods / week
                        </span>
                        {room && (
                          <span className="flex items-center gap-1">
                            <DoorOpen className="h-3 w-3" />
                            {room}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Subjects
                        </p>
                        {subjects.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No subjects scheduled in this section.</p>
                        ) : (
                          <ul className="space-y-1">
                            {subjects.map((subject) => (
                              <li key={subject.subject} className="flex items-center justify-between text-sm">
                                <span>{subject.name}</span>
                                <span className="text-xs text-muted-foreground">{subject.count}× / week</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/teacher/attendance">
                            <ClipboardCheck className="mr-1 h-3.5 w-3.5" /> Attendance
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/teacher/results">
                            <FileText className="mr-1 h-3.5 w-3.5" /> Marks
                          </Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/teacher/students">
                            <Users className="mr-1 h-3.5 w-3.5" /> Roster
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {slots.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Weekly load</CardTitle>
                <CardDescription>Lessons per day across all your sections</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {Object.entries(
                  slots.reduce<Record<string, number>>((acc, slot) => {
                    acc[slot.dayOfWeek] = (acc[slot.dayOfWeek] ?? 0) + 1
                    return acc
                  }, {}),
                ).map(([day, count]) => (
                  <Badge key={day} variant="secondary">
                    {day.slice(0, 3).toLowerCase()} · {count}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
