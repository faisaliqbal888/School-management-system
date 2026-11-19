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
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Loader2, Save, Upload } from "lucide-react"

const exams = [
  { id: "midterm-2024", name: "Mid-Term 2024", subject: "Mathematics", class: "10-A", maxMarks: 100 },
  { id: "unittest3", name: "Unit Test 3", subject: "Physics", class: "9-A", maxMarks: 50 },
]

const studentsMarks = [
  { id: "1", name: "Alex Thompson", rollNo: "01", avatar: "/alex-student.jpg", marks: "", grade: "" },
  { id: "2", name: "Emma Wilson", rollNo: "02", avatar: "/emma-student.jpg", marks: "", grade: "" },
  {
    id: "3",
    name: "Oliver Smith",
    rollNo: "03",
    avatar: "/placeholder.svg",
    marks: "",
    grade: "",
  },
  {
    id: "4",
    name: "Sophia Johnson",
    rollNo: "04",
    avatar: "/placeholder.svg",
    marks: "",
    grade: "",
  },
  { id: "5", name: "Liam Brown", rollNo: "05", avatar: "/placeholder.svg", marks: "", grade: "" },
  { id: "6", name: "Ava Davis", rollNo: "06", avatar: "/placeholder.svg", marks: "", grade: "" },
]

function calculateGrade(marks: number, maxMarks: number): string {
  const percentage = (marks / maxMarks) * 100
  if (percentage >= 90) return "A+"
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B+"
  if (percentage >= 60) return "B"
  if (percentage >= 50) return "C"
  if (percentage >= 40) return "D"
  return "F"
}

export default function TeacherResultsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [selectedExam, setSelectedExam] = useState("midterm-2024")
  const [students, setStudents] = useState(studentsMarks)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "teacher")) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  const examInfo = exams.find((e) => e.id === selectedExam)

  const updateMarks = (studentId: string, marks: string) => {
    const numMarks = Number.parseInt(marks) || 0
    const grade = marks ? calculateGrade(numMarks, examInfo?.maxMarks || 100) : ""
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, marks, grade } : s)))
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSaving(false)
    alert("Results saved successfully!")
  }

  if (isLoading || !isAuthenticated || user?.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const filledCount = students.filter((s) => s.marks).length

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <TeacherHeader />
        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Submit Results</h1>
              <p className="text-muted-foreground">Enter marks for examinations</p>
            </div>
          </div>

          {/* Exam Selection */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[250px]">
                  <label className="text-sm font-medium mb-1.5 block">Select Examination</label>
                  <Select value={selectedExam} onValueChange={setSelectedExam}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {exams.map((exam) => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.name} - {exam.subject} ({exam.class})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Submit Results
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Exam Info */}
          {examInfo && (
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Examination</p>
                  <p className="font-semibold">{examInfo.name}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-semibold">{examInfo.subject}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Maximum Marks</p>
                  <p className="font-semibold">{examInfo.maxMarks}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Progress</p>
                  <p className="font-semibold">
                    {filledCount}/{students.length} completed
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Marks Entry */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Enter Marks - Class {examInfo?.class}</CardTitle>
                <Badge variant="outline">{students.length} Students</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Roll</th>
                      <th className="text-left py-3 px-4 font-semibold">Student Name</th>
                      <th className="text-center py-3 px-4 font-semibold">Marks (out of {examInfo?.maxMarks})</th>
                      <th className="text-center py-3 px-4 font-semibold">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 px-4 text-muted-foreground">{student.rollNo}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
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
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex justify-center">
                            <Input
                              type="number"
                              min="0"
                              max={examInfo?.maxMarks}
                              value={student.marks}
                              onChange={(e) => updateMarks(student.id, e.target.value)}
                              className="w-24 text-center"
                              placeholder="0"
                            />
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {student.grade && (
                            <Badge
                              className={
                                student.grade.includes("+") || student.grade === "A"
                                  ? "bg-emerald-500"
                                  : student.grade === "B+" || student.grade === "B"
                                    ? "bg-blue-500"
                                    : student.grade === "C" || student.grade === "D"
                                      ? "bg-amber-500"
                                      : "bg-red-500"
                              }
                            >
                              {student.grade}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
