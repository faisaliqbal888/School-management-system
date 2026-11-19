"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { StudentStats } from "@/components/student/student-stats"
import { SubjectAttendance } from "@/components/student/subject-attendance"
import { RecentResults } from "@/components/student/recent-results"
import { FeeStatus } from "@/components/student/fee-status"
import { StudentNotifications } from "@/components/student/student-notifications"
import { TodaySchedule } from "@/components/student/today-schedule"
import { Loader2 } from "lucide-react"

export default function StudentDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "student")) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== "student") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <StudentHeader />
        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground">
                Class {user?.class}-{user?.section} | Roll No: {user?.rollNo} | Admission: {user?.admissionNo}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Academic Year: 2024-2025</span>
              <span className="text-border">|</span>
              <span>Semester: Fall</span>
            </div>
          </div>

          {/* Stats Cards */}
          <StudentStats />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <SubjectAttendance />
              <RecentResults />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <TodaySchedule />
              <FeeStatus />
              <StudentNotifications />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
