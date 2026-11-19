"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, RotateCcw, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface StudentMarks {
  id: string
  name: string
  rollNo: string
  avatar?: string
  marks: number | null
  maxMarks: number
  status: "entered" | "pending" | "absent"
}

const initialStudents: StudentMarks[] = [
  {
    id: "1",
    name: "Ali Khan",
    rollNo: "01",
    avatar: "/student-boy-portrait.jpg",
    marks: 85,
    maxMarks: 100,
    status: "entered",
  },
  {
    id: "2",
    name: "Sara Ahmed",
    rollNo: "02",
    avatar: "/student-girl-portrait.jpg",
    marks: 92,
    maxMarks: 100,
    status: "entered",
  },
  {
    id: "3",
    name: "Omar Hassan",
    rollNo: "03",
    avatar: "/student-boy-portrait-child.jpg",
    marks: null,
    maxMarks: 100,
    status: "pending",
  },
  {
    id: "4",
    name: "Fatima Ali",
    rollNo: "04",
    avatar: "/student-girl-portrait-teen.jpg",
    marks: 78,
    maxMarks: 100,
    status: "entered",
  },
  {
    id: "5",
    name: "Yusuf Ibrahim",
    rollNo: "05",
    avatar: "/student-boy-portrait-young.jpg",
    marks: null,
    maxMarks: 100,
    status: "absent",
  },
  { id: "6", name: "Ayesha Malik", rollNo: "06", marks: 88, maxMarks: 100, status: "entered" },
  { id: "7", name: "Hamza Qureshi", rollNo: "07", marks: null, maxMarks: 100, status: "pending" },
  { id: "8", name: "Zainab Hussain", rollNo: "08", marks: 95, maxMarks: 100, status: "entered" },
]

export function MarksEntry() {
  const [students, setStudents] = useState<StudentMarks[]>(initialStudents)
  const [selectedSubject, setSelectedSubject] = useState("mathematics")

  const updateMarks = (id: string, marks: number | null) => {
    setStudents((prev) =>
      prev.map((student) =>
        student.id === id ? { ...student, marks, status: marks !== null ? "entered" : "pending" } : student,
      ),
    )
  }

  const markAbsent = (id: string) => {
    setStudents((prev) =>
      prev.map((student) => (student.id === id ? { ...student, marks: null, status: "absent" } : student)),
    )
  }

  const stats = {
    entered: students.filter((s) => s.status === "entered").length,
    pending: students.filter((s) => s.status === "pending").length,
    absent: students.filter((s) => s.status === "absent").length,
  }

  const getGrade = (marks: number | null, maxMarks: number) => {
    if (marks === null) return null
    const percentage = (marks / maxMarks) * 100
    if (percentage >= 90) return { grade: "A+", color: "text-success" }
    if (percentage >= 80) return { grade: "A", color: "text-success" }
    if (percentage >= 70) return { grade: "B", color: "text-primary" }
    if (percentage >= 60) return { grade: "C", color: "text-warning" }
    if (percentage >= 50) return { grade: "D", color: "text-chart-3" }
    return { grade: "F", color: "text-destructive" }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">Enter Marks</CardTitle>
            <p className="text-sm text-muted-foreground">Mid-Term Examination • Class 8-A</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mathematics">Mathematics</SelectItem>
                <SelectItem value="science">Science</SelectItem>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="history">History</SelectItem>
                <SelectItem value="computer">Computer Science</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2 bg-transparent">
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" className="gap-2">
              <Save className="h-4 w-4" />
              Save Marks
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10">
            <Check className="h-5 w-5 text-success" />
            <div>
              <p className="text-xl font-bold text-success">{stats.entered}</p>
              <p className="text-xs text-muted-foreground">Entered</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-warning/10">
            <AlertCircle className="h-5 w-5 text-warning" />
            <div>
              <p className="text-xl font-bold text-warning">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-muted">
            <div className="h-5 w-5 text-center text-muted-foreground font-bold">A</div>
            <div>
              <p className="text-xl font-bold">{stats.absent}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {students.map((student) => {
            const gradeInfo = getGrade(student.marks, student.maxMarks)
            return (
              <div
                key={student.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border transition-all",
                  student.status === "entered" && "bg-success/5 border-success/30",
                  student.status === "pending" && "bg-card border-border",
                  student.status === "absent" && "bg-muted/50 border-muted",
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
                <div className="flex items-center gap-3">
                  {student.status === "absent" ? (
                    <Badge variant="outline" className="text-muted-foreground">
                      Absent
                    </Badge>
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          value={student.marks ?? ""}
                          onChange={(e) =>
                            updateMarks(student.id, e.target.value ? Number.parseInt(e.target.value) : null)
                          }
                          className="w-20 text-center"
                          placeholder="--"
                          max={student.maxMarks}
                          min={0}
                        />
                        <span className="text-sm text-muted-foreground">/ {student.maxMarks}</span>
                      </div>
                      {gradeInfo && (
                        <Badge variant="outline" className={cn("font-bold", gradeInfo.color)}>
                          {gradeInfo.grade}
                        </Badge>
                      )}
                    </>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs" onClick={() => markAbsent(student.id)}>
                    {student.status === "absent" ? "Undo" : "Absent"}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
