"use client"

import { useState } from "react"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { StudentTable, type Student } from "@/components/students/student-table"
import { StudentFilters } from "@/components/students/student-filters"
import { AddStudentModal } from "@/components/students/add-student-modal"
import { StudentDetailModal } from "@/components/students/student-detail-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, GraduationCap, UserCheck, UserX, Clock } from "lucide-react"

const stats = [
  {
    title: "Total Students",
    value: "2,847",
    icon: GraduationCap,
    color: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
  },
  {
    title: "Active Students",
    value: "2,654",
    icon: UserCheck,
    color: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-50 to-emerald-100",
  },
  {
    title: "Inactive Students",
    value: "143",
    icon: UserX,
    color: "from-red-500 to-red-600",
    bgGradient: "from-red-50 to-red-100",
  },
  {
    title: "Pending Approval",
    value: "50",
    icon: Clock,
    color: "from-amber-500 to-amber-600",
    bgGradient: "from-amber-50 to-amber-100",
  },
]

export default function AdminStudentsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const { ready } = useRequireRole("ADMIN")

  if (!ready) return <FullPageLoader />

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setDetailModalOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setAddModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold">Students Management</h1>
            <p className="text-blue-100 mt-1">Manage all students and view their comprehensive records</p>
          </div>

          {/* Stats Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${stat.bgGradient}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <StudentFilters onAddStudent={() => setAddModalOpen(true)} />

          <StudentTable onViewStudent={handleViewStudent} onEditStudent={handleEditStudent} />

          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Showing 1-8 of 2,847 students</p>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">Previous</button>
              <button className="px-3 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium">1</button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">2</button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">3</button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">Next</button>
            </div>
          </div>

          <AddStudentModal open={addModalOpen} onOpenChange={setAddModalOpen} student={selectedStudent || undefined} />
          <StudentDetailModal student={selectedStudent} open={detailModalOpen} onOpenChange={setDetailModalOpen} />
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
