"use client"

import Link from "next/link"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AttendanceChart } from "@/components/dashboard/attendance-chart"
import { TodayLessons } from "@/components/dashboard/today-lessons"
import { ResultList } from "@/components/dashboard/result-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Loader2,
  Users,
} from "lucide-react"
import { money, useDashboardSummary } from "@/lib/hooks/use-dashboard"

export default function ParentDashboardPage() {
  const { user } = useAuth()
  const { ready } = useRequireRole("PARENT")
  const { summary, isLoading, error } = useDashboardSummary()

  if (!ready) return <FullPageLoader />

  const learner = summary?.role === "PARENT" ? summary : undefined
  const children = learner?.students ?? []
  const attendanceToday = learner?.attendance.today
  const fees = learner?.fees
  const average =
    learner && learner.results.length > 0
      ? Math.round(
          learner.results.reduce((sum, result) => sum + (result.percent ?? 0), 0) / learner.results.length,
        )
      : null

  const stats = [
    {
      title: "Children",
      value: children.length || "—",
      hint: children.map((child) => child.name).join(", ") || "none linked",
      icon: Users,
      tone: "bg-rose-50 text-rose-600",
    },
    {
      title: "Attendance today",
      value: attendanceToday?.rate != null ? `${attendanceToday.rate}%` : "—",
      hint: attendanceToday ? `${attendanceToday.marked} marked` : "Not marked yet",
      icon: ClipboardCheck,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      title: "Average score",
      value: average !== null ? `${average}%` : "—",
      hint: `${learner?.results.length ?? 0} published results`,
      icon: BookOpen,
      tone: "bg-blue-50 text-blue-600",
    },
    {
      title: "Fee balance",
      value: fees ? `PKR ${money(fees.outstanding)}` : "—",
      hint: fees?.overdue ? `${fees.overdue} overdue` : "all clear",
      icon: CreditCard,
      tone: "bg-amber-50 text-amber-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="flex flex-col justify-between gap-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Assalam-o-Alaikum, {user?.name?.split(" ")[0] || "Parent"} 👋
              </h1>
              <p className="mt-1 text-rose-100">
                {children.length > 0
                  ? `Tracking ${children.length} child${children.length === 1 ? "" : "ren"} — attendance, results and fees in one place.`
                  : "No children are linked to this account yet."}
              </p>
            </div>
            <Button size="sm" variant="secondary" asChild>
              <Link href="/parent/results">
                <BookOpen className="mr-1.5 h-4 w-4" /> Report cards
              </Link>
            </Button>
          </div>

          {error ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <div>
                  <p className="font-medium">Could not load your dashboard</p>
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

              {children.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">My children</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 sm:grid-cols-2">
                    {children.map((child) => (
                      <div key={child.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={child.avatarUrl ?? undefined} alt={child.name} />
                          <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{child.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {child.className}-{child.sectionName} · {child.admissionNo}
                          </p>
                        </div>
                        <Badge variant="secondary">Roll {child.rollNo ?? "—"}</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                  <AttendanceChart
                    trend={learner?.attendance.trend}
                    compact
                    title="Attendance — last 7 days"
                    description="Across all of your children"
                  />
                  <ResultList results={learner?.results} showStudent title="Latest results" />
                </div>

                <div className="space-y-6">
                  <TodayLessons today={learner?.today} showTeacher title="Today's classes" />

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>Fees</span>
                        <Badge variant={fees?.outstanding ? "destructive" : "secondary"}>
                          {fees?.outstanding ? "Due" : "Clear"}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {fees ? (
                        <>
                          <p className="text-2xl font-bold">PKR {money(fees.outstanding)}</p>
                          <p className="text-xs text-muted-foreground">outstanding across all invoices</p>
                          <Progress value={fees.collectionRate ?? 0} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            PKR {money(fees.paid)} paid of PKR {money(fees.billed)}
                          </p>
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link href="/parent/fees">View invoices</Link>
                          </Button>
                        </>
                      ) : (
                        <p className="py-3 text-sm text-muted-foreground">No invoices raised yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <CalendarDays className="h-4 w-4" /> Quick links
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {[
                        { label: "Attendance history", href: "/parent/attendance" },
                        { label: "Results & report cards", href: "/parent/results" },
                        { label: "Timetable", href: "/parent/timetable" },
                        { label: "Fees & receipts", href: "/parent/fees" },
                      ].map((link) => (
                        <Button key={link.href} variant="ghost" size="sm" className="w-full justify-start" asChild>
                          <Link href={link.href}>{link.label}</Link>
                        </Button>
                      ))}
                    </CardContent>
                  </Card>
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
