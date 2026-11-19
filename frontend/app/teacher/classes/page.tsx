"use client"

import { useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, BookOpen, TrendingUp, Clock, Calendar, ChevronRight, FileText, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"

const myClasses = [
  {
    id: 1,
    name: "Class 10-A",
    subject: "Mathematics",
    totalStudents: 45,
    avgAttendance: 92,
    avgPerformance: 78,
    nextClass: "Today, 8:00 AM",
    room: "Room 101",
    schedule: ["Mon 8AM", "Wed 9AM", "Fri 10AM"],
    topPerformers: ["Rahul V.", "Priya S.", "Amit K."],
    pendingTasks: 2,
  },
  {
    id: 2,
    name: "Class 10-B",
    subject: "Mathematics",
    totalStudents: 42,
    avgAttendance: 88,
    avgPerformance: 72,
    nextClass: "Today, 10:00 AM",
    room: "Room 102",
    schedule: ["Mon 10AM", "Thu 2PM", "Fri 9AM"],
    topPerformers: ["Sneha R.", "Vikram D.", "Neha P."],
    pendingTasks: 3,
  },
  {
    id: 3,
    name: "Class 9-A",
    subject: "Mathematics",
    totalStudents: 40,
    avgAttendance: 95,
    avgPerformance: 82,
    nextClass: "Tomorrow, 11:00 AM",
    room: "Room 103",
    schedule: ["Mon 11AM", "Wed 9AM", "Thu 1PM"],
    topPerformers: ["Arjun M.", "Kavya L.", "Rohan S."],
    pendingTasks: 1,
  },
  {
    id: 4,
    name: "Class 9-B",
    subject: "Mathematics",
    totalStudents: 43,
    avgAttendance: 90,
    avgPerformance: 75,
    nextClass: "Tomorrow, 8:00 AM",
    room: "Room 101",
    schedule: ["Tue 8AM", "Wed 10AM", "Fri 1PM"],
    topPerformers: ["Divya K.", "Sanjay R.", "Meera T."],
    pendingTasks: 2,
  },
  {
    id: 5,
    name: "Class 11-A",
    subject: "Mathematics",
    totalStudents: 38,
    avgAttendance: 87,
    avgPerformance: 70,
    nextClass: "Today, 1:00 PM",
    room: "Room 104",
    schedule: ["Mon 1PM", "Wed 2PM", "Fri 10AM"],
    topPerformers: ["Ananya B.", "Karthik V.", "Pooja N."],
    pendingTasks: 4,
  },
  {
    id: 6,
    name: "Class 12-A",
    subject: "Mathematics",
    totalStudents: 35,
    avgAttendance: 93,
    avgPerformance: 85,
    nextClass: "Today, 3:00 PM",
    room: "Room 105",
    schedule: ["Mon 3PM", "Wed 3PM", "Sat 8AM"],
    topPerformers: ["Aditya S.", "Nisha R.", "Varun K."],
    pendingTasks: 1,
  },
]

const upcomingSyllabus = [
  { class: "10-A", topic: "Quadratic Equations - Part 2", deadline: "Dec 15" },
  { class: "10-B", topic: "Trigonometry Introduction", deadline: "Dec 18" },
  { class: "9-A", topic: "Linear Equations in Two Variables", deadline: "Dec 12" },
  { class: "12-A", topic: "Differentiation - Advanced", deadline: "Dec 20" },
]

export default function TeacherClassesPage() {
  const [selectedClass, setSelectedClass] = useState(myClasses[0])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <TeacherSidebar />
      <div className="pl-64">
        <TeacherHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">My Classes</h1>
            <p className="text-muted-foreground">Manage your assigned classes and track progress</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Class List */}
            <div className="space-y-3">
              {myClasses.map((cls) => (
                <Card
                  key={cls.id}
                  className={cn(
                    "cursor-pointer border-0 shadow-md transition-all hover:shadow-lg",
                    selectedClass.id === cls.id && "ring-2 ring-emerald-500",
                  )}
                  onClick={() => setSelectedClass(cls)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">{cls.name}</h3>
                        <p className="text-sm text-muted-foreground">{cls.subject}</p>
                      </div>
                      <Badge
                        className={cn(
                          cls.pendingTasks > 2 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700",
                        )}
                      >
                        {cls.pendingTasks} pending
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {cls.totalStudents}
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        {cls.avgPerformance}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <Progress value={cls.avgAttendance} className="h-1.5" />
                      <p className="mt-1 text-xs text-muted-foreground">{cls.avgAttendance}% Attendance</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Class Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card */}
              <Card className="border-0 shadow-lg overflow-hidden">
                <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-600" />
                <CardContent className="relative pt-0 -mt-8">
                  <div className="flex items-end gap-4">
                    <div className="h-16 w-16 rounded-xl bg-white shadow-lg flex items-center justify-center">
                      <BookOpen className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div className="flex-1 pb-2">
                      <h2 className="text-xl font-bold">{selectedClass.name}</h2>
                      <p className="text-muted-foreground">{selectedClass.subject}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        Take Attendance
                      </Button>
                      <Button variant="outline" className="gap-2 bg-transparent">
                        <FileText className="h-4 w-4" />
                        Enter Marks
                      </Button>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="mt-6 grid grid-cols-4 gap-4">
                    <div className="p-3 rounded-xl bg-slate-50 text-center">
                      <Users className="h-5 w-5 mx-auto text-emerald-600" />
                      <p className="mt-1 text-xl font-bold">{selectedClass.totalStudents}</p>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 text-center">
                      <TrendingUp className="h-5 w-5 mx-auto text-blue-600" />
                      <p className="mt-1 text-xl font-bold">{selectedClass.avgPerformance}%</p>
                      <p className="text-xs text-muted-foreground">Avg. Score</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 text-center">
                      <ClipboardCheck className="h-5 w-5 mx-auto text-amber-600" />
                      <p className="mt-1 text-xl font-bold">{selectedClass.avgAttendance}%</p>
                      <p className="text-xs text-muted-foreground">Attendance</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 text-center">
                      <Calendar className="h-5 w-5 mx-auto text-purple-600" />
                      <p className="mt-1 text-xl font-bold">{selectedClass.schedule.length}</p>
                      <p className="text-xs text-muted-foreground">Classes/Week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="students">Top Students</TabsTrigger>
                  <TabsTrigger value="schedule">Schedule</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Next Class</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                            <Clock className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{selectedClass.nextClass}</p>
                            <p className="text-sm text-muted-foreground">{selectedClass.room}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Pending Tasks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-amber-600" />
                          </div>
                          <div>
                            <p className="font-semibold">{selectedClass.pendingTasks} Tasks</p>
                            <p className="text-sm text-muted-foreground">Need attention</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Performance Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { grade: "A (90-100%)", count: 8, color: "bg-emerald-500" },
                          { grade: "B (80-89%)", count: 15, color: "bg-blue-500" },
                          { grade: "C (70-79%)", count: 12, color: "bg-amber-500" },
                          { grade: "D (60-69%)", count: 7, color: "bg-orange-500" },
                          { grade: "F (Below 60%)", count: 3, color: "bg-red-500" },
                        ].map((item) => (
                          <div key={item.grade} className="flex items-center gap-3">
                            <span className="w-32 text-sm">{item.grade}</span>
                            <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className={cn("h-full rounded-full", item.color)}
                                style={{ width: `${(item.count / selectedClass.totalStudents) * 100}%` }}
                              />
                            </div>
                            <span className="w-8 text-sm font-medium">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="students" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Top Performers</CardTitle>
                      <CardDescription>Students with highest scores in recent assessments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedClass.topPerformers.map((student, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                            <div
                              className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                                index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : "bg-amber-700",
                              )}
                            >
                              {index + 1}
                            </div>
                            <span className="font-medium">{student}</span>
                            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="schedule" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Weekly Schedule</CardTitle>
                      <CardDescription>Class timings for this section</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-3">
                        {selectedClass.schedule.map((slot, index) => (
                          <div
                            key={index}
                            className="p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-center"
                          >
                            <Calendar className="h-5 w-5 mx-auto text-emerald-600" />
                            <p className="mt-2 font-medium text-emerald-700">{slot}</p>
                            <p className="text-sm text-emerald-600">{selectedClass.room}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Upcoming Syllabus */}
          <Card className="mt-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Upcoming Syllabus Deadlines</CardTitle>
              <CardDescription>Topics to be covered across all classes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {upcomingSyllabus.map((item, index) => (
                  <div key={index} className="p-4 rounded-xl border bg-white hover:shadow-md transition-shadow">
                    <Badge className="bg-emerald-100 text-emerald-700">{item.class}</Badge>
                    <h4 className="mt-2 font-medium">{item.topic}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">Deadline: {item.deadline}</p>
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
