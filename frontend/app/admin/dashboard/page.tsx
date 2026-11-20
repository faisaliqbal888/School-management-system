"use client"

import { useRequireRole, useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { FeeCollectionChart } from "@/components/dashboard/fee-collection-chart"
import { RecentStudents } from "@/components/dashboard/recent-students"
import { UpcomingEvents } from "@/components/dashboard/upcoming-events"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { TodayLessons } from "@/components/dashboard/today-lessons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle, GraduationCap, Loader2, School, Users, Wallet } from "lucide-react"
import { useDashboardSummary, money } from "@/lib/hooks/use-dashboard"

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { ready } = useRequireRole("ADMIN")
  const { summary, isLoading, error } = useDashboardSummary()

  if (!ready) return <FullPageLoader />

  const admin = summary?.role === "ADMIN" ? summary : undefined
  const counts = admin?.counts
  const attendance = admin?.attendance

  const stats = [
    {
      title: "Total students",
      value: counts?.students ?? "—",
      hint: `${counts?.activeStudents ?? 0} active`,
      icon: Users,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      title: "Teaching staff",
      value: counts?.teachers ?? "—",
      hint: `${counts?.sections ?? 0} sections`,
      icon: GraduationCap,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Attendance today",
      value: attendance?.today?.rate !== null && attendance?.today?.rate !== undefined
        ? `${attendance.today.rate}%`
        : "—",
      hint: attendance?.today ? `${attendance.today.marked} marked` : "Not marked yet",
      icon: School,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      title: "Fees collected",
      value: admin ? `PKR ${money(admin.fees.paid)}` : "—",
      hint: admin ? `${admin.fees.collectionRate ?? 0}% of PKR ${money(admin.fees.billed)}` : undefined,
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-blue-50/20 p-6">
          <div className="flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}! 👋
              </h1>
              <p className="mt-1 text-blue-100">Here&apos;s what&apos;s happening at your school today.</p>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-sm backdrop-blur-sm">
              <span className="font-semibold">
                Academic Year: {admin?.academicYear?.name ?? "—"}
              </span>
              <span className="text-white/50">•</span>
              <span className="font-semibold">{counts?.classes ?? 0} classes</span>
            </div>
          </div>

          {error ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="font-medium">Could not load the dashboard</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <Button variant="outline" onClick={() => window.location.reload()}>
                  Try again
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <StatsCards stats={stats} isLoading={isLoading} />

              <div className="grid gap-6 lg:grid-cols-2">
                <AttendanceChart trend={attendance?.trend} />
                <FeeCollectionChart fees={admin?.fees} />
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <RecentStudents students={admin?.recentStudents} isLoading={isLoading} />
                </div>
                <div className="space-y-6">
                  <QuickActions />
                  <TodayLessons today={admin?.today} />
                  <UpcomingEvents exams={admin?.exams} />
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
