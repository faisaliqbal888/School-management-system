"use client"

import { useRequireRole } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { AttendanceMarking } from "@/components/attendance/attendance-marking"
import { AttendanceReport } from "@/components/attendance/attendance-report"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  Loader2,
  RefreshCw,
  UserCheck,
  XCircle,
} from "lucide-react"
import { useTodayOverview } from "@/lib/hooks/use-attendance"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function AdminAttendancePage() {
  const { ready } = useRequireRole("ADMIN")

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/20">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Attendance Management</h1>
            <p className="mt-1 text-green-100">
              Mark daily attendance, review history and spot sections that haven&apos;t been marked
            </p>
          </div>

          <TodayOverview />

          <Tabs defaultValue="marking" className="space-y-5">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="marking" className="gap-2">
                <CalendarCheck className="h-4 w-4" />
                Mark Attendance
              </TabsTrigger>
              <TabsTrigger value="report" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="marking">
              <AttendanceMarking />
            </TabsContent>

            <TabsContent value="report">
              <AttendanceReport showSectionFilter />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function TodayOverview() {
  const { overview, isLoading, error, refetch } = useTodayOverview()

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </CardContent>
      </Card>
    )
  }

  if (!overview) return null

  const { byStatus, sectionsMarked, sectionsTotal } = overview
  const totalMarked = byStatus.present + byStatus.absent + byStatus.late + byStatus.excused
  const presentRate = totalMarked === 0 ? null : Math.round(((byStatus.present + byStatus.late) / totalMarked) * 1000) / 10
  const unmarkedSections = overview.sections.filter((s) => s.marked === 0)

  const cards = [
    {
      title: "Present today",
      value: byStatus.present + byStatus.late,
      hint: presentRate !== null ? `${presentRate}% of marked` : "Nothing marked yet",
      icon: UserCheck,
      tone: "from-emerald-500 to-emerald-600",
      bg: "from-emerald-50 to-emerald-100",
    },
    {
      title: "Absent today",
      value: byStatus.absent,
      hint: `${byStatus.late} late · ${byStatus.excused} excused`,
      icon: XCircle,
      tone: "from-red-500 to-red-600",
      bg: "from-red-50 to-red-100",
    },
    {
      title: "Sections marked",
      value: `${sectionsMarked}/${sectionsTotal}`,
      hint: unmarkedSections.length === 0 ? "All done 🎉" : `${unmarkedSections.length} pending`,
      icon: CalendarDays,
      tone: "from-blue-500 to-blue-600",
      bg: "from-blue-50 to-blue-100",
    },
    {
      title: "Date",
      value: formatDate(overview.date),
      hint: "Today · UTC",
      icon: Clock,
      tone: "from-violet-500 to-purple-600",
      bg: "from-violet-50 to-violet-100",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Today at a glance</h2>
        <Button variant="ghost" size="sm" onClick={refetch} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.title} className={cn("border-0 bg-gradient-to-br shadow-md", c.bg)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {c.title}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold text-gray-900">{c.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow",
                    c.tone,
                  )}
                >
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* section completion */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Section completion</CardTitle>
          <span className="text-xs text-muted-foreground">
            {sectionsMarked} of {sectionsTotal} marked
          </span>
        </CardHeader>
        <CardContent>
          <Progress
            value={sectionsTotal === 0 ? 0 : (sectionsMarked / sectionsTotal) * 100}
            className="mb-4 h-2"
          />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {overview.sections.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "flex items-center justify-between rounded-lg border p-2.5 text-sm",
                  s.complete
                    ? "border-emerald-200 bg-emerald-50/50"
                    : s.marked > 0
                      ? "border-amber-200 bg-amber-50/50"
                      : "border-border",
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {s.className} — {s.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.marked}/{s.students} marked
                    {s.rate !== null ? ` · ${s.rate}% present` : ""}
                  </p>
                </div>
                {s.complete ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                ) : s.marked > 0 ? (
                  <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" />
                ) : (
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
