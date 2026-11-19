"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Download, Trophy, TrendingUp, Medal } from "lucide-react"

const exams = ["Mid-Term 2024", "Unit Test 3", "Unit Test 2", "First Term 2024"]

const resultsData = {
  "Mid-Term 2024": {
    subjects: [
      { name: "Mathematics", marks: 92, total: 100, grade: "A+", position: 3 },
      { name: "Physics", marks: 88, total: 100, grade: "A", position: 5 },
      { name: "Chemistry", marks: 85, total: 100, grade: "A", position: 8 },
      { name: "English", marks: 90, total: 100, grade: "A+", position: 2 },
      { name: "Computer Science", marks: 95, total: 100, grade: "A+", position: 1 },
      { name: "Biology", marks: 82, total: 100, grade: "A", position: 10 },
    ],
    totalMarks: 532,
    totalOutOf: 600,
    percentage: 88.67,
    rank: 5,
    classAverage: 72.3,
  },
}

export default function StudentResultsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [selectedExam, setSelectedExam] = useState("Mid-Term 2024")

  const { ready } = useRequireRole("STUDENT")

  if (!ready) return <FullPageLoader />

  const result = resultsData[selectedExam as keyof typeof resultsData]

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <StudentHeader />
        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Results & Grades</h1>
              <p className="text-muted-foreground">View your examination results and grade cards</p>
            </div>
            <div className="flex gap-3">
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map((exam) => (
                    <SelectItem key={exam} value={exam}>
                      {exam}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          {result && (
            <>
              {/* Summary Cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 shadow-md bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/80">Percentage</p>
                        <p className="text-3xl font-bold">{result.percentage}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-white/80" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white/80">Class Rank</p>
                        <p className="text-3xl font-bold">#{result.rank}</p>
                      </div>
                      <Trophy className="h-8 w-8 text-white/80" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total Marks</p>
                    <p className="text-2xl font-bold">
                      {result.totalMarks}/{result.totalOutOf}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-md">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Class Average</p>
                    <p className="text-2xl font-bold">{result.classAverage}%</p>
                    <Badge className="mt-1 bg-emerald-500">
                      +{(result.percentage - result.classAverage).toFixed(1)}% above
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Subject-wise Results */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>Subject-wise Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Subject</th>
                          <th className="text-center py-3 px-4 font-semibold">Marks</th>
                          <th className="text-center py-3 px-4 font-semibold">Grade</th>
                          <th className="text-center py-3 px-4 font-semibold">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.subjects.map((subject, idx) => (
                          <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                            <td className="py-3 px-4 font-medium">{subject.name}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-semibold">{subject.marks}</span>
                              <span className="text-muted-foreground">/{subject.total}</span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <Badge
                                className={
                                  subject.grade.includes("+")
                                    ? "bg-emerald-500"
                                    : subject.grade === "A"
                                      ? "bg-blue-500"
                                      : "bg-amber-500"
                                }
                              >
                                {subject.grade}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                {subject.position <= 3 && (
                                  <Medal
                                    className={`h-4 w-4 ${
                                      subject.position === 1
                                        ? "text-amber-500"
                                        : subject.position === 2
                                          ? "text-gray-400"
                                          : "text-amber-700"
                                    }`}
                                  />
                                )}
                                <span>#{subject.position}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
