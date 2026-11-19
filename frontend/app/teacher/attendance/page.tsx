"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, CheckCircle2, XCircle, Clock, Save, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const classes = [
  { id: "10-A", name: "Class 10-A", subject: "Mathematics" },
  { id: "10-B", name: "Class 10-B", subject: "Mathematics" },
  { id: "9-A", name: "Class 9-A", subject: "Physics" },
  { id: "9-B", name: "Class 9-B", subject: "Mathematics" },
]

const studentsData: Record<
  string,
  { id: string; name: string; rollNo: string; avatar: string; status: "present" | "absent" | "late" | null }[]
> = {
  "10-A": [
    { id: "1", name: "Alex Thompson", rollNo: "01", avatar: "/diverse-group-meeting.png", status: null },
    { id: "2", name: "Emma Wilson", rollNo: "02", avatar: "/portrait-young-woman.png", status: null },
    { id: "3", name: "Oliver Smith", rollNo: "03", avatar: "/oliver.jpg", status: null },
    { id: "4", name: "Sophia Johnson", rollNo: "04", avatar: "/portrait-sophia.png", status: null },
    { id: "5", name: "Liam Brown", rollNo: "05", avatar: "/liam.jpg", status: null },
    { id: "6", name: "Ava Davis", rollNo: "06", avatar: "/ava.jpg", status: null },
    { id: "7", name: "Noah Miller", rollNo: "07", avatar: "/noah.jpg", status: null },
    { id: "8", name: "Isabella Garcia", rollNo: "08", avatar: "/isabella.jpg", status: null },
  ],
  "10-B": [
    { id: "9", name: "James Brown", rollNo: "01", avatar: "/portrait-thoughtful-man.png", status: null },
    { id: "10", name: "Mia Anderson", rollNo: "02", avatar: "/abstract-geometric-mia.png", status: null },
    { id: "11", name: "Benjamin Taylor", rollNo: "03", avatar: "/benjamin.jpg", status: null },
    { id: "12", name: "Charlotte Thomas", rollNo: "04", avatar: "/charlotte.jpg", status: null },
  ],
  "9-A": [
    { id: "13", name: "Sophie Davis", rollNo: "01", avatar: "/sophie-davis.jpg", status: null },
    { id: "14", name: "Lucas Martin", rollNo: "02", avatar: "/lucas.jpg", status: null },
    { id: "15", name: "Amelia White", rollNo: "03", avatar: "/amelia.jpg", status: null },
  ],
  "9-B": [
    { id: "16", name: "Michael Lee", rollNo: "01", avatar: "/michael-lee.jpg", status: null },
    { id: "17", name: "Harper Clark", rollNo: "02", avatar: "/harper.jpg", status: null },
  ],
}

export default function TeacherAttendancePage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [selectedClass, setSelectedClass] = useState("10-A")
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState(studentsData["10-A"])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "teacher")) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  useEffect(() => {
    setStudents(studentsData[selectedClass] || [])
  }, [selectedClass])

  const updateStatus = (studentId: string, status: "present" | "absent" | "late") => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: s.status === status ? null : status } : s)),
    )
  }

  const markAllPresent = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, status: "present" })))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSaving(false)
    alert("Attendance saved successfully!")
  }

  const presentCount = students.filter((s) => s.status === "present").length
  const absentCount = students.filter((s) => s.status === "absent").length
  const lateCount = students.filter((s) => s.status === "late").length

  if (isLoading || !isAuthenticated || user?.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectedClassInfo = classes.find((c) => c.id === selectedClass)

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <TeacherHeader />
        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Mark Attendance</h1>
              <p className="text-muted-foreground">Record subject-wise attendance for your classes</p>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1.5 block">Select Class</label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} - {cls.subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-1.5 block">Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-10 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <Button variant="outline" onClick={markAllPresent}>
                    Mark All Present
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Attendance
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md border-l-4 border-l-red-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="text-2xl font-bold text-red-600">{absentCount}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Late</p>
                  <p className="text-2xl font-bold text-amber-600">{lateCount}</p>
                </div>
                <Clock className="h-8 w-8 text-amber-500" />
              </CardContent>
            </Card>
          </div>

          {/* Student List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {selectedClassInfo?.name} - {selectedClassInfo?.subject}
                </CardTitle>
                <Badge variant="outline">{students.length} Students</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-sm font-medium text-muted-foreground">{student.rollNo}</span>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.avatar || "/placeholder.svg"} />
                        <AvatarFallback>
                          {student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(student.id, "present")}
                        className={cn(
                          "w-24",
                          student.status === "present" &&
                            "bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600 hover:text-white",
                        )}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Present
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(student.id, "absent")}
                        className={cn(
                          "w-24",
                          student.status === "absent" &&
                            "bg-red-500 text-white border-red-500 hover:bg-red-600 hover:text-white",
                        )}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Absent
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(student.id, "late")}
                        className={cn(
                          "w-20",
                          student.status === "late" &&
                            "bg-amber-500 text-white border-amber-500 hover:bg-amber-600 hover:text-white",
                        )}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Late
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
