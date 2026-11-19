"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Check, X, Clock, Search, Save, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type AttendanceStatus = "present" | "absent" | "late" | null

interface StudentAttendance {
  id: string
  name: string
  rollNo: string
  avatar?: string
  status: AttendanceStatus
}

const initialStudents: StudentAttendance[] = [
  { id: "1", name: "Ali Khan", rollNo: "01", avatar: "/student-boy-portrait.jpg", status: null },
  { id: "2", name: "Sara Ahmed", rollNo: "02", avatar: "/student-girl-portrait.jpg", status: null },
  { id: "3", name: "Omar Hassan", rollNo: "03", avatar: "/student-boy-portrait-child.jpg", status: null },
  { id: "4", name: "Fatima Ali", rollNo: "04", avatar: "/student-girl-portrait-teen.jpg", status: null },
  { id: "5", name: "Yusuf Ibrahim", rollNo: "05", avatar: "/student-boy-portrait-young.jpg", status: null },
  { id: "6", name: "Ayesha Malik", rollNo: "06", status: null },
  { id: "7", name: "Hamza Qureshi", rollNo: "07", status: null },
  { id: "8", name: "Zainab Hussain", rollNo: "08", status: null },
  { id: "9", name: "Ahmed Raza", rollNo: "09", status: null },
  { id: "10", name: "Maryam Khan", rollNo: "10", status: null },
]

export function AttendanceMarking() {
  const [students, setStudents] = useState<StudentAttendance[]>(initialStudents)
  const [searchQuery, setSearchQuery] = useState("")

  const updateStatus = (id: string, status: AttendanceStatus) => {
    setStudents((prev) => prev.map((student) => (student.id === id ? { ...student, status } : student)))
  }

  const markAllPresent = () => {
    setStudents((prev) => prev.map((student) => ({ ...student, status: "present" })))
  }

  const resetAll = () => {
    setStudents((prev) => prev.map((student) => ({ ...student, status: null })))
  }

  const filteredStudents = students.filter(
    (student) => student.name.toLowerCase().includes(searchQuery.toLowerCase()) || student.rollNo.includes(searchQuery),
  )

  const stats = {
    present: students.filter((s) => s.status === "present").length,
    absent: students.filter((s) => s.status === "absent").length,
    late: students.filter((s) => s.status === "late").length,
    unmarked: students.filter((s) => s.status === null).length,
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Mark Attendance</CardTitle>
            <p className="text-sm text-muted-foreground">
              Class 8-A •{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={markAllPresent} className="gap-2 bg-transparent">
              <Check className="h-4 w-4" />
              Mark All Present
            </Button>
            <Button variant="outline" size="sm" onClick={resetAll} className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save Attendance
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10">
            <Check className="h-5 w-5 text-success" />
            <div>
              <p className="text-2xl font-bold text-success">{stats.present}</p>
              <p className="text-xs text-muted-foreground">Present</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-destructive/10">
            <X className="h-5 w-5 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10">
            <Clock className="h-5 w-5 text-warning" />
            <div>
              <p className="text-2xl font-bold text-warning">{stats.late}</p>
              <p className="text-xs text-muted-foreground">Late</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{stats.unmarked}</p>
              <p className="text-xs text-muted-foreground">Unmarked</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or roll number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Student List */}
        <div className="grid gap-2 max-h-[400px] overflow-y-auto pr-2">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-xl border transition-all",
                student.status === "present" && "bg-success/5 border-success/30",
                student.status === "absent" && "bg-destructive/5 border-destructive/30",
                student.status === "late" && "bg-warning/5 border-warning/30",
                student.status === null && "bg-card border-border hover:border-primary/30",
              )}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{student.name}</p>
                  <p className="text-xs text-muted-foreground">Roll No: {student.rollNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant={student.status === "present" ? "default" : "outline"}
                  className={cn(
                    "h-9 w-9 rounded-full transition-all",
                    student.status === "present" && "bg-success hover:bg-success/90",
                  )}
                  onClick={() => updateStatus(student.id, "present")}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={student.status === "absent" ? "default" : "outline"}
                  className={cn(
                    "h-9 w-9 rounded-full transition-all",
                    student.status === "absent" && "bg-destructive hover:bg-destructive/90",
                  )}
                  onClick={() => updateStatus(student.id, "absent")}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={student.status === "late" ? "default" : "outline"}
                  className={cn(
                    "h-9 w-9 rounded-full transition-all",
                    student.status === "late" && "bg-warning hover:bg-warning/90 text-warning-foreground",
                  )}
                  onClick={() => updateStatus(student.id, "late")}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
