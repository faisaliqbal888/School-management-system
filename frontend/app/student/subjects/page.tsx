"use client"

import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Clock, DoorOpen, Loader2, TrendingUp, User } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useMySubjects } from "@/lib/hooks/use-subjects"
import { gradeTone } from "@/lib/hooks/use-dashboard"
import { cn } from "@/lib/utils"

export default function StudentSubjectsPage() {
  const { ready } = useRequireRole("STUDENT")
  const { subjects, isLoading, error } = useMySubjects()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const graded = subjects.filter((subject) => subject.averagePercent !== null)
  const classAverage =
    graded.length === 0
      ? null
      : Math.round(graded.reduce((sum, subject) => sum + (subject.averagePercent ?? 0), 0) / graded.length)

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <StudentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <BookOpen className="h-7 w-7" /> My Subjects
            </h1>
            <p className="mt-1 text-blue-100">
              {subjects.length} subjects this week
              {classAverage !== null ? ` · ${classAverage}% average across graded subjects` : ""}
            </p>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Could not load your subjects. Please try again later.
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-44 w-full" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                <BookOpen className="h-9 w-9 text-muted-foreground/50" />
                <p className="font-medium">No subjects yet</p>
                <p className="text-sm text-muted-foreground">
                  Your timetable has not been published, so there are no subjects to list.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {subjects.map((subject) => (
                <Card key={subject.subjectId}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{subject.name}</CardTitle>
                        <CardDescription>{subject.code ?? "—"}</CardDescription>
                      </div>
                      <div
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                          gradeTone(subject.latestGrade),
                        )}
                      >
                        {subject.latestGrade ?? "—"}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {subject.teacherName ?? "Unassigned"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {subject.periodsPerWeek} periods / week
                      </span>
                      {subject.roomNo && (
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {subject.roomNo}
                        </span>
                      )}
                    </div>

                    {subject.averagePercent !== null ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" /> Average
                          </span>
                          <span className="font-semibold">{subject.averagePercent}%</span>
                        </div>
                        <Progress value={subject.averagePercent} className="h-2" />
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <Badge variant="secondary">{subject.resultsCount} results</Badge>
                          {subject.bestPercent !== null && (
                            <Badge variant="outline">best {subject.bestPercent}%</Badge>
                          )}
                          {subject.latestPercent !== null && (
                            <Badge variant="outline">latest {subject.latestPercent}%</Badge>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                        No published results for this subject yet.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
