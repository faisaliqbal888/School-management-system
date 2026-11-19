"use client"

import { useRequireRole } from "@/lib/auth-context"

import { useState } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, TrendingUp, FileText, Video, Download, CheckCircle2, Circle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const subjects = [
  {
    id: 1,
    name: "Mathematics",
    code: "MATH-101",
    teacher: "Mr. Sharma",
    teacherAvatar: "/male-teacher.png",
    credits: 5,
    attendance: 92,
    grade: "A",
    progress: 68,
    color: "bg-blue-500",
    topics: [
      { name: "Algebra", completed: true },
      { name: "Calculus", completed: true },
      { name: "Trigonometry", completed: true },
      { name: "Statistics", completed: false },
      { name: "Probability", completed: false },
    ],
    resources: [
      { type: "pdf", name: "Chapter 1 - Introduction to Calculus", size: "2.4 MB" },
      { type: "video", name: "Solving Quadratic Equations", duration: "25 min" },
      { type: "pdf", name: "Practice Problems Set 1", size: "1.2 MB" },
    ],
    upcomingAssignments: [
      { name: "Integration Practice", dueDate: "Dec 15, 2025" },
      { name: "Chapter 5 Test", dueDate: "Dec 20, 2025" },
    ],
  },
  {
    id: 2,
    name: "Physics",
    code: "PHY-101",
    teacher: "Mrs. Gupta",
    teacherAvatar: "/female-teacher.png",
    credits: 5,
    attendance: 88,
    grade: "A-",
    progress: 55,
    color: "bg-emerald-500",
    topics: [
      { name: "Mechanics", completed: true },
      { name: "Thermodynamics", completed: true },
      { name: "Optics", completed: false },
      { name: "Electromagnetism", completed: false },
      { name: "Modern Physics", completed: false },
    ],
    resources: [
      { type: "pdf", name: "Newton's Laws Explained", size: "3.1 MB" },
      { type: "video", name: "Wave Motion Animation", duration: "18 min" },
    ],
    upcomingAssignments: [{ name: "Lab Report - Optics", dueDate: "Dec 12, 2025" }],
  },
  {
    id: 3,
    name: "Chemistry",
    code: "CHEM-101",
    teacher: "Dr. Singh",
    teacherAvatar: "/doctor-professor.jpg",
    credits: 5,
    attendance: 85,
    grade: "B+",
    progress: 45,
    color: "bg-purple-500",
    topics: [
      { name: "Atomic Structure", completed: true },
      { name: "Chemical Bonding", completed: true },
      { name: "Organic Chemistry", completed: false },
      { name: "Electrochemistry", completed: false },
    ],
    resources: [
      { type: "pdf", name: "Periodic Table Guide", size: "1.8 MB" },
      { type: "video", name: "Lab Safety Procedures", duration: "12 min" },
    ],
    upcomingAssignments: [{ name: "Organic Chemistry Quiz", dueDate: "Dec 18, 2025" }],
  },
  {
    id: 4,
    name: "English",
    code: "ENG-101",
    teacher: "Ms. Patel",
    teacherAvatar: "/young-female-teacher.png",
    credits: 4,
    attendance: 95,
    grade: "A",
    progress: 72,
    color: "bg-amber-500",
    topics: [
      { name: "Grammar Fundamentals", completed: true },
      { name: "Essay Writing", completed: true },
      { name: "Literature Analysis", completed: true },
      { name: "Public Speaking", completed: false },
    ],
    resources: [
      { type: "pdf", name: "Essay Writing Guide", size: "890 KB" },
      { type: "pdf", name: "Shakespeare Collection", size: "4.2 MB" },
    ],
    upcomingAssignments: [{ name: "Book Review Essay", dueDate: "Dec 22, 2025" }],
  },
  {
    id: 5,
    name: "Computer Science",
    code: "CS-101",
    teacher: "Mr. Kumar",
    teacherAvatar: "/tech-teacher.png",
    credits: 4,
    attendance: 90,
    grade: "A",
    progress: 60,
    color: "bg-cyan-500",
    topics: [
      { name: "Programming Basics", completed: true },
      { name: "Data Structures", completed: true },
      { name: "Algorithms", completed: false },
      { name: "Database Management", completed: false },
    ],
    resources: [
      { type: "pdf", name: "Python Programming Guide", size: "5.6 MB" },
      { type: "video", name: "Sorting Algorithms Explained", duration: "32 min" },
    ],
    upcomingAssignments: [{ name: "Coding Project", dueDate: "Dec 25, 2025" }],
  },
]

export default function StudentSubjectsPage() {
  const { ready } = useRequireRole("STUDENT")

  if (!ready) return <FullPageLoader />

  const [selectedSubject, setSelectedSubject] = useState(subjects[0])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <StudentSidebar />
      <div className="pl-64">
        <StudentHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">My Subjects</h1>
            <p className="text-muted-foreground">View your enrolled subjects and learning progress</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Subject List */}
            <div className="space-y-3">
              {subjects.map((subject) => (
                <Card
                  key={subject.id}
                  className={cn(
                    "cursor-pointer border-0 shadow-md transition-all hover:shadow-lg",
                    selectedSubject.id === subject.id && "ring-2 ring-blue-500",
                  )}
                  onClick={() => setSelectedSubject(subject)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "h-12 w-12 rounded-xl flex items-center justify-center text-white",
                          subject.color,
                        )}
                      >
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{subject.name}</h3>
                        <p className="text-sm text-muted-foreground">{subject.code}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Progress value={subject.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground">{subject.progress}%</span>
                        </div>
                      </div>
                      <Badge
                        className={cn(
                          subject.grade.startsWith("A")
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700",
                        )}
                      >
                        {subject.grade}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Subject Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className={cn("h-24", selectedSubject.color)} />
                <CardContent className="relative pt-0 -mt-8">
                  <div className="flex items-end gap-4">
                    <div className="h-16 w-16 rounded-xl bg-white shadow-lg flex items-center justify-center">
                      <BookOpen className={cn("h-8 w-8", selectedSubject.color.replace("bg-", "text-"))} />
                    </div>
                    <div className="flex-1 pb-2">
                      <h2 className="text-xl font-bold">{selectedSubject.name}</h2>
                      <p className="text-muted-foreground">{selectedSubject.code}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {selectedSubject.credits} Credits
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {selectedSubject.attendance}% Attendance
                      </Badge>
                    </div>
                  </div>

                  {/* Teacher Info */}
                  <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                    <Avatar>
                      <AvatarImage src={selectedSubject.teacherAvatar || "/placeholder.svg"} />
                      <AvatarFallback>{selectedSubject.teacher.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{selectedSubject.teacher}</p>
                      <p className="text-xs text-muted-foreground">Subject Teacher</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="syllabus" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="syllabus">Syllabus</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                  <TabsTrigger value="assignments">Assignments</TabsTrigger>
                </TabsList>

                <TabsContent value="syllabus" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Course Progress</CardTitle>
                      <CardDescription>Topics covered in this subject</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubject.topics.map((topic, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl transition-colors",
                              topic.completed ? "bg-emerald-50" : "bg-slate-50",
                            )}
                          >
                            {topic.completed ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span
                              className={cn("font-medium", topic.completed ? "text-emerald-700" : "text-foreground")}
                            >
                              {topic.name}
                            </span>
                            {topic.completed && (
                              <Badge className="ml-auto bg-emerald-100 text-emerald-700">Completed</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="resources" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Learning Resources</CardTitle>
                      <CardDescription>Download materials and watch videos</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubject.resources.map((resource, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                          >
                            {resource.type === "pdf" ? (
                              <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-red-600" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Video className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-sm">{resource.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {resource.type === "pdf" ? resource.size : resource.duration}
                              </p>
                            </div>
                            <Button size="sm" variant="ghost">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="assignments" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Assignments</CardTitle>
                      <CardDescription>Tasks and deadlines to complete</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedSubject.upcomingAssignments.map((assignment, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50"
                          >
                            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{assignment.name}</p>
                              <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                            </div>
                            <Button size="sm" className="bg-amber-600 hover:bg-amber-700">
                              Submit
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
