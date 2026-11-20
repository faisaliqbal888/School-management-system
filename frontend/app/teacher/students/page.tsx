"use client"

import { useState } from "react"
import Link from "next/link"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Search, Users, ClipboardCheck, BookOpen } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useStudents } from "@/lib/hooks/use-students"

export default function TeacherStudentsPage() {
  const { ready } = useRequireRole("TEACHER")

  const [search, setSearch] = useState("")
  const [applied, setApplied] = useState("")

  const { students, meta, isLoading, error } = useStudents({
    page: 1,
    limit: 50,
    search: applied || undefined,
  })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Users className="h-7 w-7" /> My Students
            </h1>
            <p className="mt-1 text-emerald-100">
              {meta ? `${meta.total} students across the sections you teach` : "Students in your sections"}
            </p>
          </div>

          <form
            className="relative max-w-md"
            onSubmit={(event) => {
              event.preventDefault()
              setApplied(search)
            }}
          >
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, admission no or roll no…"
              className="pl-8"
              aria-label="Search students"
            />
          </form>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                <Users className="h-9 w-9 text-muted-foreground/50" />
                <p className="font-medium">No students found</p>
                <p className="text-sm text-muted-foreground">
                  {applied ? "Try a different search." : "You have no sections assigned yet."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {students.map((student) => (
                <Card key={student.id}>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={student.avatarUrl ?? undefined} alt={student.name} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-700">
                        {student.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{student.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {student.admissionNo}
                        {student.rollNo ? ` · Roll ${student.rollNo}` : ""}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {student.className && (
                          <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                            {student.className}
                            {student.sectionName ? `-${student.sectionName}` : ""}
                          </Badge>
                        )}
                        <Badge
                          variant={student.status === "ACTIVE" ? "outline" : "destructive"}
                          className="h-5 px-1.5 text-[10px]"
                        >
                          {student.status.toLowerCase()}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-1">
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                        <Link href="/teacher/attendance">
                          <ClipboardCheck className="mr-1 h-3 w-3" /> Attend
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 px-2 text-xs" asChild>
                        <Link href="/teacher/results">
                          <BookOpen className="mr-1 h-3 w-3" /> Marks
                        </Link>
                      </Button>
                    </div>
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
