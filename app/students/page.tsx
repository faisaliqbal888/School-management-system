"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { StudentTable, type Student } from "@/components/students/student-table"
import { StudentFilters } from "@/components/students/student-filters"
import { AddStudentModal } from "@/components/students/add-student-modal"
import { StudentDetailModal } from "@/components/students/student-detail-modal"
import { Card, CardContent } from "@/components/ui/card"
import { GraduationCap, UserCheck, UserX, Clock } from "lucide-react"

const stats = [
  {
    title: "Total Students",
    value: "2,847",
    icon: GraduationCap,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Active Students",
    value: "2,654",
    icon: UserCheck,
    color: "bg-success/10 text-success",
  },
  {
    title: "Inactive Students",
    value: "143",
    icon: UserX,
    color: "bg-destructive/10 text-destructive",
  },
  {
    title: "Pending Approval",
    value: "50",
    icon: Clock,
    color: "bg-warning/10 text-warning",
  },
]

export default function StudentsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student)
    setDetailModalOpen(true)
  }

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student)
    setAddModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <Header />
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Students</h1>
            <p className="text-muted-foreground">Manage student records, enrollments, and information.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters */}
          <StudentFilters onAddStudent={() => setAddModalOpen(true)} />

          {/* Table */}
          <StudentTable onViewStudent={handleViewStudent} onEditStudent={handleEditStudent} />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Showing 1-8 of 2,847 students</p>
            <div className="flex gap-2">
              <button className="px-3 py-1 text-sm border rounded-md hover:bg-muted">Previous</button>
              <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md">1</button>
              <button className="px-3 py-1 text-sm border rounded-md hover:bg-muted">2</button>
              <button className="px-3 py-1 text-sm border rounded-md hover:bg-muted">3</button>
              <button className="px-3 py-1 text-sm border rounded-md hover:bg-muted">Next</button>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <AddStudentModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <StudentDetailModal student={selectedStudent} open={detailModalOpen} onOpenChange={setDetailModalOpen} />
    </div>
  )
}
