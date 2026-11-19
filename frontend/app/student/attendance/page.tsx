"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"

const subjects = ["All Subjects", "Mathematics", "Physics", "Chemistry", "English", "Computer Science", "Biology"]

const attendanceData = [
  {
    date: "Dec 6, 2024",
    day: "Friday",
    subjects: [
      { name: "Mathematics", status: "present" },
      { name: "Physics", status: "present" },
      { name: "Chemistry", status: "late" },
      { name: "English", status: "present" },
    ],
  },
  {
    date: "Dec 5, 2024",
    day: "Thursday",
    subjects: [
      { name: "Mathematics", status: "present" },
      { name: "Computer Science", status: "present" },
      { name: "Biology", status: "absent" },
      { name: "English", status: "present" },
    ],
  },
  {
    date: "Dec 4, 2024",
    day: "Wednesday",
    subjects: [
      { name: "Mathematics", status: "present" },
      { name: "Physics", status: "present" },
      { name: "Chemistry", status: "present" },
      { name: "Computer Science", status: "present" },
    ],
  },
  {
    date: "Dec 3, 2024",
    day: "Tuesday",
    subjects: [
      { name: "Mathematics", status: "present" },
      { name: "Physics", status: "late" },
      { name: "English", status: "present" },
      { name: "Biology", status: "present" },
    ],
  },
]

const statusConfig = {
  present: { icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-950" },
  absent: { icon: XCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-950" },
  late: { icon: Clock, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-950" },
  excused: { icon: AlertCircle, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-950" },
}

export default function StudentAttendancePage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [selectedSubject, setSelectedSubject] = useState("All Subjects")

  const { ready } = useRequireRole("STUDENT")

  if (!ready) return <FullPageLoader />

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <StudentHeader />
        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Attendance</h1>
              <p className="text-muted-foreground">View your subject-wise attendance records</p>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall</p>
                    <p className="text-2xl font-bold text-emerald-600">92%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <Progress value={92} className="mt-3 h-2" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Present Days</p>
                    <p className="text-2xl font-bold">156</p>
                  </div>
                  <Badge className="bg-emerald-500">+5 this week</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Absent Days</p>
                    <p className="text-2xl font-bold">8</p>
                  </div>
                  <Badge variant="destructive">-2 this month</Badge>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Late Arrivals</p>
                    <p className="text-2xl font-bold">6</p>
                  </div>
                  <Badge variant="secondary">Acceptable</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance History */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Attendance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attendanceData.map((day, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold">{day.date}</p>
                      <p className="text-sm text-muted-foreground">{day.day}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {day.subjects.map((subject, sidx) => {
                      const config = statusConfig[subject.status as keyof typeof statusConfig]
                      const Icon = config.icon
                      return (
                        <div key={sidx} className={`p-2 rounded-lg ${config.bg} flex items-center gap-2`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-sm font-medium truncate">{subject.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

/** Shared loading fallback while the session is being verified. */
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
