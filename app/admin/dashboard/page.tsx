"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { FeeCollectionChart } from "@/components/dashboard/fee-collection-chart"
import { RecentStudents } from "@/components/dashboard/recent-students"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { Loader2 } from "lucide-react"

export default function AdminDashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
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

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 min-h-screen">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.name || "Admin"}! 👋</h1>
              <p className="text-blue-100 mt-1">Here&apos;s what&apos;s happening at your school today.</p>
            </div>
            <div className="flex items-center gap-3 text-sm bg-white/20 px-4 py-2 rounded-lg backdrop-blur-sm border border-white/30">
              <span className="font-semibold">Academic Year: 2024-2025</span>
              <span className="text-white/50">•</span>
              <span className="font-semibold">Fall Semester</span>
            </div>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AttendanceChart />
            <FeeCollectionChart />
          </div>

          {/* Bottom Section */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RecentStudents />
            </div>
            <div className="space-y-6">
              <QuickActions />
              <UpcomingEvents />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
