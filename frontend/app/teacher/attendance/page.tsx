"use client"

import { useRequireRole } from "@/lib/auth-context"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { AttendanceMarking } from "@/components/attendance/attendance-marking"
import { AttendanceReport } from "@/components/attendance/attendance-report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarCheck, ClipboardList, Loader2 } from "lucide-react"

export default function TeacherAttendancePage() {
  const { ready } = useRequireRole("TEACHER")

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
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
            <p className="text-muted-foreground">
              Mark attendance for the sections you teach and review their history
            </p>
          </div>

          <Tabs defaultValue="marking" className="space-y-5">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="marking" className="gap-2">
                <CalendarCheck className="h-4 w-4" />
                Mark Attendance
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marking">
              <AttendanceMarking />
            </TabsContent>

            <TabsContent value="history">
              <AttendanceReport showSectionFilter />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
