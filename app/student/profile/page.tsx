"use client"

import { useState } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/lib/auth-context"
import { User, Mail, Phone, MapPin, Calendar, BookOpen, Award, Camera, Edit3, Save, Shield, Bell } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function StudentProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  const studentInfo = {
    name: user?.name || "Rahul Verma",
    email: "rahul.verma@eduflow.com",
    phone: "+91 98765 43210",
    address: "123, Park Street, Mumbai, Maharashtra - 400001",
    dateOfBirth: "15 March 2008",
    admissionDate: "01 April 2023",
    rollNo: "2024001",
    class: "10",
    section: "A",
    bloodGroup: "O+",
    parentName: "Mr. Rajesh Verma",
    parentPhone: "+91 98765 43211",
    parentEmail: "rajesh.verma@email.com",
  }

  const achievements = [
    { title: "Perfect Attendance", description: "100% attendance for 3 consecutive months", date: "Oct 2025" },
    { title: "Academic Excellence", description: "Scored above 90% in Mid-term exams", date: "Sep 2025" },
    { title: "Science Fair Winner", description: "First place in Inter-school Science Fair", date: "Aug 2025" },
    { title: "Math Olympiad", description: "District level qualifier", date: "Jul 2025" },
  ]

  const academicSummary = {
    currentGPA: 3.85,
    rank: 5,
    totalStudents: 45,
    attendance: 92,
    subjects: 6,
    pendingAssignments: 3,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <StudentSidebar />
      <div className="pl-64">
        <StudentHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">View and manage your personal information</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-cyan-600" />
              <CardContent className="relative pt-0 -mt-16 text-center">
                <div className="relative inline-block">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src="/student-boy.png" />
                    <AvatarFallback className="text-3xl bg-blue-100 text-blue-600">
                      {studentInfo.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="mt-4 text-xl font-bold">{studentInfo.name}</h2>
                <p className="text-muted-foreground">
                  Class {studentInfo.class}-{studentInfo.section} | Roll No: {studentInfo.rollNo}
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge className="bg-blue-100 text-blue-700">Active Student</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700">2024-25</Badge>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-blue-600">{academicSummary.currentGPA}</p>
                    <p className="text-xs text-muted-foreground">GPA</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-emerald-600">#{academicSummary.rank}</p>
                    <p className="text-xs text-muted-foreground">Class Rank</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-amber-600">{academicSummary.attendance}%</p>
                    <p className="text-xs text-muted-foreground">Attendance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details & Settings */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="academic">Academic</TabsTrigger>
                  <TabsTrigger value="achievements">Achievements</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Personal Information</CardTitle>
                        <CardDescription>Your basic details and contact information</CardDescription>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} className="gap-2">
                        {isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                        {isEditing ? "Save" : "Edit"}
                      </Button>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Full Name</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {isEditing ? (
                            <Input defaultValue={studentInfo.name} className="border-0 bg-transparent p-0 h-auto" />
                          ) : (
                            <span className="font-medium">{studentInfo.name}</span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Email Address</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{studentInfo.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Phone Number</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{studentInfo.phone}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Date of Birth</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{studentInfo.dateOfBirth}</span>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-muted-foreground">Address</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{studentInfo.address}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Parent/Guardian Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Parent Name</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{studentInfo.parentName}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Parent Phone</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{studentInfo.parentPhone}</span>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-muted-foreground">Parent Email</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{studentInfo.parentEmail}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="academic" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Academic Overview</CardTitle>
                      <CardDescription>Your academic performance summary</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                              <BookOpen className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Current GPA</p>
                              <p className="text-2xl font-bold text-blue-600">{academicSummary.currentGPA}</p>
                            </div>
                          </div>
                          <Progress value={(academicSummary.currentGPA / 4) * 100} className="mt-3 h-2" />
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                              <Award className="h-6 w-6 text-emerald-600" />
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">Class Rank</p>
                              <p className="text-2xl font-bold text-emerald-600">
                                {academicSummary.rank} / {academicSummary.totalStudents}
                              </p>
                            </div>
                          </div>
                          <Progress
                            value={(1 - (academicSummary.rank - 1) / academicSummary.totalStudents) * 100}
                            className="mt-3 h-2"
                          />
                        </div>
                      </div>

                      <div className="mt-6 grid gap-3 md:grid-cols-3">
                        <div className="p-4 rounded-xl bg-slate-50 text-center">
                          <p className="text-3xl font-bold text-foreground">{academicSummary.subjects}</p>
                          <p className="text-sm text-muted-foreground">Enrolled Subjects</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 text-center">
                          <p className="text-3xl font-bold text-foreground">{academicSummary.attendance}%</p>
                          <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 text-center">
                          <p className="text-3xl font-bold text-amber-600">{academicSummary.pendingAssignments}</p>
                          <p className="text-sm text-muted-foreground">Pending Assignments</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="achievements" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">My Achievements</CardTitle>
                      <CardDescription>Badges and recognitions earned</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {achievements.map((achievement, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-100"
                          >
                            <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                              <Award className="h-6 w-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-amber-900">{achievement.title}</h4>
                              <p className="text-sm text-amber-700">{achievement.description}</p>
                            </div>
                            <Badge variant="outline" className="border-amber-300 text-amber-700">
                              {achievement.date}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="settings" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Preferences
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Assignment Reminders</p>
                          <p className="text-sm text-muted-foreground">Get reminded about due assignments</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Result Notifications</p>
                          <p className="text-sm text-muted-foreground">Be notified when results are published</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Security
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                        <Shield className="h-4 w-4" />
                        Change Password
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                        <Mail className="h-4 w-4" />
                        Update Email
                      </Button>
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
