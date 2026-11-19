"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Search, MessageSquare, Eye, TrendingUp, TrendingDown } from "lucide-react"

const allStudents = [
  {
    id: "1",
    name: "Alex Thompson",
    class: "10-A",
    rollNo: "01",
    avatar: "/diverse-group-meeting.png",
    attendance: 94,
    avgGrade: "A",
    trend: "up",
    subjects: { Mathematics: "A+", Physics: "A" },
  },
  {
    id: "2",
    name: "Emma Wilson",
    class: "10-A",
    rollNo: "02",
    avatar: "/portrait-young-woman.png",
    attendance: 98,
    avgGrade: "A+",
    trend: "up",
    subjects: { Mathematics: "A+", Physics: "A+" },
  },
  {
    id: "3",
    name: "Oliver Smith",
    class: "10-A",
    rollNo: "03",
    avatar: "/oliver.jpg",
    attendance: 88,
    avgGrade: "B+",
    trend: "down",
    subjects: { Mathematics: "B+", Physics: "B" },
  },
  {
    id: "4",
    name: "James Brown",
    class: "10-B",
    rollNo: "01",
    avatar: "/portrait-thoughtful-man.png",
    attendance: 85,
    avgGrade: "B+",
    trend: "up",
    subjects: { Mathematics: "B+" },
  },
  {
    id: "5",
    name: "Sophie Davis",
    class: "9-A",
    rollNo: "01",
    avatar: "/sophie-davis.jpg",
    attendance: 92,
    avgGrade: "A",
    trend: "up",
    subjects: { Physics: "A" },
  },
  {
    id: "6",
    name: "Michael Lee",
    class: "9-B",
    rollNo: "01",
    avatar: "/michael-lee.jpg",
    attendance: 78,
    avgGrade: "B",
    trend: "down",
    subjects: { Mathematics: "B" },
  },
]

export default function TeacherStudentsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [selectedClass, setSelectedClass] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "teacher")) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  const filteredStudents = allStudents.filter((student) => {
    const matchesClass = selectedClass === "all" || student.class === selectedClass
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesClass && matchesSearch
  })

  if (isLoading || !isAuthenticated || user?.role !== "teacher") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <TeacherHeader />
        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">My Students</h1>
              <p className="text-muted-foreground">View and manage students in your classes</p>
            </div>
          </div>

          {/* Filters */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="10-A">Class 10-A</SelectItem>
                    <SelectItem value="10-B">Class 10-B</SelectItem>
                    <SelectItem value="9-A">Class 9-A</SelectItem>
                    <SelectItem value="9-B">Class 9-B</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Students Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((student) => (
              <Card key={student.id} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={student.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-emerald-100 text-emerald-600">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">{student.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Class {student.class} | Roll #{student.rollNo}
                          </p>
                        </div>
                        {student.trend === "up" ? (
                          <TrendingUp className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="flex items-center gap-4 mt-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Attendance</p>
                          <p
                            className={`font-semibold ${
                              student.attendance >= 90
                                ? "text-emerald-600"
                                : student.attendance >= 75
                                  ? "text-amber-600"
                                  : "text-red-600"
                            }`}
                          >
                            {student.attendance}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Avg Grade</p>
                          <Badge
                            variant="outline"
                            className={
                              student.avgGrade.includes("+") || student.avgGrade === "A"
                                ? "border-emerald-500 text-emerald-600"
                                : "border-blue-500 text-blue-600"
                            }
                          >
                            {student.avgGrade}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{student.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={student.avatar || "/placeholder.svg"} />
                                  <AvatarFallback>
                                    {student.name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-semibold text-lg">{student.name}</p>
                                  <p className="text-muted-foreground">
                                    Class {student.class} | Roll #{student.rollNo}
                                  </p>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 rounded-lg bg-muted">
                                  <p className="text-sm text-muted-foreground">Overall Attendance</p>
                                  <p className="text-xl font-bold">{student.attendance}%</p>
                                </div>
                                <div className="p-3 rounded-lg bg-muted">
                                  <p className="text-sm text-muted-foreground">Average Grade</p>
                                  <p className="text-xl font-bold">{student.avgGrade}</p>
                                </div>
                              </div>
                              <div>
                                <p className="font-medium mb-2">Subject Performance</p>
                                <div className="space-y-2">
                                  {Object.entries(student.subjects).map(([subject, grade]) => (
                                    <div
                                      key={subject}
                                      className="flex items-center justify-between p-2 rounded bg-muted"
                                    >
                                      <span>{subject}</span>
                                      <Badge>{grade}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
