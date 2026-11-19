"use client"

import { useRequireRole } from "@/lib/auth-context"

import { useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/lib/auth-context"
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Award,
  Camera,
  Edit3,
  Save,
  Shield,
  Bell,
  GraduationCap,
  BookOpen,
  Users,
  Clock, Loader2 } from "lucide-react"

export default function TeacherProfilePage() {
  const { user } = useAuth()
  const { ready } = useRequireRole("TEACHER")
  const [isEditing, setIsEditing] = useState(false)

  if (!ready) return <FullPageLoader />

  const teacherInfo = {
    name: user?.name || "Mr. Sharma",
    email: "sharma@eduflow.com",
    phone: "+91 98765 12345",
    address: "456, Teachers Colony, Delhi - 110001",
    dateOfBirth: "10 January 1985",
    joiningDate: "15 June 2015",
    employeeId: "TCH-2015-001",
    department: "Mathematics",
    designation: "Senior Teacher",
    qualification: "M.Sc. Mathematics, B.Ed",
    experience: "9 Years",
    specialization: "Algebra & Calculus",
  }

  const teachingStats = {
    totalClasses: 8,
    totalStudents: 320,
    averageRating: 4.8,
    classesThisWeek: 28,
    hoursThisMonth: 120,
    assignmentsGraded: 156,
  }

  const qualifications = [
    { degree: "M.Sc. Mathematics", institution: "Delhi University", year: "2008" },
    { degree: "B.Ed", institution: "IGNOU", year: "2010" },
    { degree: "B.Sc. Mathematics", institution: "Delhi University", year: "2006" },
  ]

  const achievements = [
    { title: "Best Teacher Award", description: "Awarded by the school for outstanding performance", year: "2023" },
    { title: "100% Board Results", description: "All students passed with distinction", year: "2022" },
    { title: "Teacher Training Certification", description: "Advanced pedagogy training", year: "2021" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <TeacherSidebar />
      <div className="pl-64">
        <TeacherHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">View and manage your professional information</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Card */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600" />
              <CardContent className="relative pt-0 -mt-16 text-center">
                <div className="relative inline-block">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                    <AvatarImage src="/male-teacher-professional.jpg" />
                    <AvatarFallback className="text-3xl bg-emerald-100 text-emerald-600">
                      {teacherInfo.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <h2 className="mt-4 text-xl font-bold">{teacherInfo.name}</h2>
                <p className="text-muted-foreground">{teacherInfo.designation}</p>
                <p className="text-sm text-muted-foreground">{teacherInfo.department} Department</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                  <Badge className="bg-blue-100 text-blue-700">{teacherInfo.experience}</Badge>
                </div>

                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-emerald-600">{teachingStats.totalClasses}</p>
                    <p className="text-xs text-muted-foreground">Classes</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-blue-600">{teachingStats.totalStudents}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50">
                    <p className="text-2xl font-bold text-amber-600">{teachingStats.averageRating}</p>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Details & Settings */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="professional">Professional</TabsTrigger>
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
                          <span className="font-medium">{teacherInfo.name}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Employee ID</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.employeeId}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Email Address</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.email}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Phone Number</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.phone}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Date of Birth</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.dateOfBirth}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Joining Date</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.joiningDate}</span>
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-muted-foreground">Address</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.address}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="professional" className="mt-4 space-y-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Professional Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Department</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.department}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Designation</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.designation}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Qualification</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.qualification}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-muted-foreground">Specialization</Label>
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-50">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{teacherInfo.specialization}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Educational Qualifications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {qualifications.map((qual, index) => (
                          <div key={index} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50">
                            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-emerald-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{qual.degree}</h4>
                              <p className="text-sm text-muted-foreground">{qual.institution}</p>
                            </div>
                            <Badge variant="outline">{qual.year}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Teaching Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                          <Users className="h-6 w-6 text-emerald-600" />
                          <p className="mt-2 text-2xl font-bold">{teachingStats.totalStudents}</p>
                          <p className="text-sm text-muted-foreground">Total Students</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                          <Clock className="h-6 w-6 text-blue-600" />
                          <p className="mt-2 text-2xl font-bold">{teachingStats.hoursThisMonth}</p>
                          <p className="text-sm text-muted-foreground">Hours This Month</p>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100">
                          <BookOpen className="h-6 w-6 text-amber-600" />
                          <p className="mt-2 text-2xl font-bold">{teachingStats.assignmentsGraded}</p>
                          <p className="text-sm text-muted-foreground">Assignments Graded</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="achievements" className="mt-4">
                  <Card className="border-0 shadow-md">
                    <CardHeader>
                      <CardTitle className="text-lg">Achievements & Recognitions</CardTitle>
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
                              {achievement.year}
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
                          <p className="font-medium">Class Reminders</p>
                          <p className="text-sm text-muted-foreground">Get reminded before classes</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Parent Messages</p>
                          <p className="text-sm text-muted-foreground">Notify for new parent messages</p>
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

function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
