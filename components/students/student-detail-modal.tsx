"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStudentDetail } from "@/lib/hooks/useStudentDetail"
import type { Student } from "./student-table"
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit,
  Printer,
  User,
  GraduationCap,
  CreditCard,
  ClipboardCheck,
  FileText,
  MessageSquare,
  TrendingUp,
} from "lucide-react"

interface StudentDetailModalProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentDetailModal({ student, open, onOpenChange }: StudentDetailModalProps) {
  const { student: detailedStudent } = useStudentDetail(student?.id || null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (open) {
      setActiveTab("overview")
    }
  }, [open, student?.id])

  const displayStudent = detailedStudent || student
  const academicData = detailedStudent?.academics
  const resultsData = detailedStudent?.results || []
  const feesData = detailedStudent?.fees
  const attendanceData = detailedStudent?.attendance
  const documentsData = detailedStudent?.documents || []
  const notesData = detailedStudent?.notes || []

  if (!displayStudent) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl p-0 border-0 shadow-2xl rounded-xl [&>button]:text-white [&>button]:bg-white/10 [&>button]:hover:bg-white/20 [&>button]:top-4 [&>button]:right-4 [&>button]:h-8 [&>button]:w-8">
        <DialogTitle className="sr-only">Student Details: {displayStudent.name}</DialogTitle>
        {/* Premium Gradient Header */}
        <div className="relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 p-6 text-white rounded-t-xl">
          <div className="absolute inset-0 overflow-hidden rounded-t-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full -ml-36 -mb-36 blur-3xl" />
          </div>

          <div className="relative z-10">
            <div className="flex items-end justify-between gap-4 mb-4">
              <div className="flex items-end gap-4">
                <Avatar className="h-24 w-24 ring-4 ring-white/40 shadow-lg border-2 border-white">
                  <AvatarImage src={displayStudent.avatar} alt={displayStudent.name} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white text-2xl font-bold">
                    {displayStudent.name.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-3xl font-bold text-white">{displayStudent.name}</h2>
                  <p className="text-blue-100 text-sm font-semibold">{displayStudent.admissionNo}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-emerald-400 text-emerald-900 font-bold">✓ {displayStudent.status}</Badge>
                    <Badge className="bg-white/30 text-white border border-white/50">Class {displayStudent.class}-{displayStudent.section}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" className="gap-2 bg-white text-purple-600 hover:bg-blue-50 font-semibold">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button size="sm" className="gap-2 bg-white/25 text-white hover:bg-white/40 backdrop-blur">
                  <Printer className="h-4 w-4" />
                  Print
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <p className="text-blue-100 text-xs font-semibold uppercase">Class Rank</p>
                <p className="text-2xl font-bold text-white">#{academicData?.classRank || 3}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-100 text-xs font-semibold uppercase">Attendance</p>
                <p className="text-2xl font-bold text-white">{attendanceData?.rate || '94%'}</p>
              </div>
              <div className="text-center">
                <p className="text-blue-100 text-xs font-semibold uppercase">Fee Status</p>
                <p className={`text-xl font-bold ${feesData?.pending === '$0' ? 'text-emerald-300' : 'text-yellow-300'}`}>
                  {feesData?.pending === '$0' ? 'Paid' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Content */}
        <div className="p-6 bg-gradient-to-b from-gray-50 to-white">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-white p-1 rounded-lg border border-gray-200 shadow-sm grid grid-cols-3 sm:flex sm:flex-wrap md:flex-nowrap w-full h-auto gap-1">
              <TabsTrigger value="overview" className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded font-semibold text-xs px-2 py-2">
                <User className="h-3.5 w-3.5 mr-1" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="academics" className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded font-semibold text-xs px-2 py-2">
                <GraduationCap className="h-3.5 w-3.5 mr-1" />
                Academics
              </TabsTrigger>
              <TabsTrigger value="results" className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded font-semibold text-xs px-2 py-2">
                <TrendingUp className="h-3.5 w-3.5 mr-1" />
                Results
              </TabsTrigger>
              <TabsTrigger value="fees" className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded font-semibold text-xs px-2 py-2">
                <CreditCard className="h-3.5 w-3.5 mr-1" />
                Fees
              </TabsTrigger>
              <TabsTrigger value="attendance" className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded font-semibold text-xs px-2 py-2">
                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                Attendance
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded font-semibold text-xs px-2 py-2">
                <FileText className="h-3.5 w-3.5 mr-1" />
                Docs
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-sm hover:shadow-lg transition-all border-b-4 border-blue-200 bg-white">
                  <CardHeader className="pb-3 bg-blue-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      Personal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                      <p className="text-sm text-gray-900">{displayStudent.email}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Phone</p>
                      <p className="text-sm text-gray-900">{displayStudent.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">DOB</p>
                      <p className="text-sm text-gray-900">{displayStudent.dateOfBirth}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Address</p>
                      <p className="text-sm text-gray-900">{displayStudent.address}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm hover:shadow-lg transition-all border-b-4 border-purple-200 bg-white">
                  <CardHeader className="pb-3 bg-purple-50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-5 w-5 text-purple-600" />
                      Guardian Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-4">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Parent Name</p>
                      <p className="text-sm text-gray-900">{displayStudent.parentName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Relationship</p>
                      <p className="text-sm text-gray-900">Father</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Contact</p>
                      <p className="text-sm text-gray-900">{displayStudent.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase">Email</p>
                      <p className="text-sm text-gray-900">{displayStudent.parentName.toLowerCase().replace(" ", ".")}@email.com</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Academics Tab */}
            <TabsContent value="academics" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-blue-50 border-l-4 border-blue-500">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-semibold text-gray-600">OVERALL GRADE</p>
                    <p className="text-4xl font-bold text-blue-600 mt-2">{academicData?.overallGrade || '85%'}</p>
                    <p className="text-xs text-gray-500 mt-1">Performance Score</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-purple-50 border-l-4 border-purple-500">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-semibold text-gray-600">CLASS RANK</p>
                    <p className="text-4xl font-bold text-purple-600 mt-2">#{academicData?.classRank || 3}</p>
                    <p className="text-xs text-gray-500 mt-1">Out of Class</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm bg-green-50 border-l-4 border-green-500">
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-semibold text-gray-600">GRADE LEVEL</p>
                    <p className="text-4xl font-bold text-green-600 mt-2">{academicData?.gradeLevel || 'A'}</p>
                    <p className="text-xs text-gray-500 mt-1">Letter Grade</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-blue-600" />
                    Subject Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {academicData?.subjects?.map((item: any) => (
                    <div key={item.subject}>
                      <div className="flex justify-between mb-2">
                        <span className="font-medium text-gray-800">{item.subject}</span>
                        <span className="font-bold text-blue-600">{item.score}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${item.score}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {resultsData.map((result: any, idx: number) => (
                  <Card key={idx} className="border-0 shadow-sm border-l-4 border-amber-500 bg-amber-50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex justify-between">
                        <span>{result.exam}</span>
                        <span className="text-amber-600">{result.score}%</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${result.score}%` }} />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-gray-600 font-semibold">GRADE</p>
                          <p className="text-gray-900 font-bold mt-1">{result.grade}</p>
                        </div>
                        <div>
                          <p className="text-gray-600 font-semibold">DATE</p>
                          <p className="text-gray-900 font-bold mt-1">{result.date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Fees Tab */}
            <TabsContent value="fees" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm border-l-4 border-green-500 bg-green-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Total Paid</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{feesData?.totalPaid || '$4,500'}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm border-l-4 border-amber-500 bg-amber-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Pending</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">{feesData?.pending || '$1,500'}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm border-l-4 border-blue-500 bg-blue-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Total Fee</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{feesData?.totalFee || '$6,000'}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Attendance Tab */}
            <TabsContent value="attendance" className="space-y-4">
              <div className="grid md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm border-l-4 border-blue-500 bg-blue-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Rate</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">{attendanceData?.rate || '94%'}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm border-l-4 border-green-500 bg-green-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Present</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">{attendanceData?.presentDays || 156}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm border-l-4 border-red-500 bg-red-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Absent</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">{attendanceData?.absentDays || 10}</p>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm border-l-4 border-amber-500 bg-amber-50">
                  <CardContent className="pt-6 text-center">
                    <p className="text-xs font-semibold text-gray-600 uppercase">Late</p>
                    <p className="text-3xl font-bold text-amber-600 mt-2">{attendanceData?.lateArrivals || 5}</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {documentsData.map((doc: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg hover:bg-blue-50 transition">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{doc.name}</p>
                        <p className="text-xs text-gray-500">{doc.uploadDate}</p>
                      </div>
                      <Button size="sm" className="bg-blue-600 text-white">Download</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-indigo-600" />
                    Notes & Remarks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {notesData.map((note: any, idx: number) => (
                    <div key={idx} className="p-3 rounded-lg bg-indigo-50 border border-indigo-200">
                      <div className="flex justify-between mb-2">
                        <p className="font-semibold text-sm">{note.author}</p>
                        <p className="text-xs text-gray-500">{note.date}</p>
                      </div>
                      <p className="text-sm text-gray-700">{note.note}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
