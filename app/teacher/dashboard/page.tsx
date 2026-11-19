"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { TeacherStats } from "@/components/teacher/teacher-stats"
import { TodayClasses } from "@/components/teacher/today-classes"
import { PendingTasks } from "@/components/teacher/pending-tasks"
import { ClassRoster } from "@/components/teacher/class-roster"
import { Loader2 } from "lucide-react"

export default function TeacherDashboard() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "teacher")) {
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

  if (!isAuthenticated || user?.role !== "teacher") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <TeacherHeader />
        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">
                Welcome back, {user?.name?.split(" ")[0]}!
              </h1>
              <p className="text-muted-foreground">
                {user?.department} Department | Staff ID: {user?.staffNo}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Academic Year: 2024-2025</span>
              <span className="text-border">|</span>
              <span>Semester: Fall</span>
            </div>
          </div>

          {/* Stats Cards */}
          <TeacherStats />

          {/* Main Content Grid */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - 2 cols */}
            <div className="lg:col-span-2 space-y-6">
              <TodayClasses />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <PendingTasks />
              <ClassRoster />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
