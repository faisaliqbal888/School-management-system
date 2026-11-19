"use client"

import Link from "next/link"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  FileText,
  Loader2,
  ChevronRight,
  CalendarDays,
} from "lucide-react"

const stats = [
  { title: "Attendance", value: "94%", hint: "This month", icon: ClipboardCheck, color: "from-emerald-500 to-teal-600" },
  { title: "Average Grade", value: "A", hint: "Midterm 2025", icon: GraduationCap, color: "from-blue-500 to-indigo-600" },
  { title: "Fee Due", value: "Rs 12,000", hint: "Due 10 Dec", icon: CreditCard, color: "from-amber-500 to-orange-600" },
  { title: "Upcoming Exams", value: "3", hint: "Next 2 weeks", icon: FileText, color: "from-violet-500 to-purple-600" },
]

const recentResults = [
  { subject: "Mathematics", marks: 92, total: 100, grade: "A+" },
  { subject: "Physics", marks: 84, total: 100, grade: "A" },
  { subject: "English", marks: 78, total: 100, grade: "B" },
  { subject: "Chemistry", marks: 88, total: 100, grade: "A" },
]

const announcements = [
  { title: "Parent-Teacher Meeting", date: "6 Dec 2025", body: "PTM for all classes, 9:00 AM – 1:00 PM." },
  { title: "Winter Vacation", date: "20 Dec 2025", body: "School closed 20 Dec – 5 Jan." },
  { title: "Fee Reminder", date: "10 Dec 2025", body: "December tuition fee is due." },
]

export default function ParentDashboardPage() {
  const { user } = useAuth()
  const { ready } = useRequireRole("PARENT")

  if (!ready) return <FullPageLoader />

  const children = user?.children ?? []

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          {/* Welcome */}
          <div className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Assalam-o-Alaikum, {user?.name?.split(" ")[0] || "Parent"} 👋
              </h1>
              <p className="mt-1 text-rose-100">
                Here is how {children.length === 1 ? "your child is" : "your children are"} doing this term.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-white/30 bg-white/20 px-4 py-2 text-sm backdrop-blur-sm">
              <CalendarDays className="h-4 w-4" />
              <span className="font-semibold">Academic Year 2025-2026</span>
            </div>
          </div>

          {/* Children */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">My Children</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/parent/children">
                  View all <ChevronRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {children.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No children are linked to this account yet. Please contact the school office.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {children.map((child) => (
                    <div
                      key={child.studentId}
                      className="flex items-center gap-4 rounded-lg border border-border bg-muted/30 p-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{child.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {child.className ?? "—"} · {child.admissionNo}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-emerald-600">
                        Active
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 shadow-md transition-shadow hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">
                        {stat.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold text-gray-900">{stat.value}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{stat.hint}</p>
                    </div>
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}
                    >
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Results */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Recent Results</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/parent/results">
                    All results <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentResults.map((r) => (
                  <div key={r.subject} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{r.subject}</span>
                      <span className="text-muted-foreground">
                        {r.marks}/{r.total}
                        <Badge variant="secondary" className="ml-2">
                          {r.grade}
                        </Badge>
                      </span>
                    </div>
                    <Progress value={(r.marks / r.total) * 100} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">School Announcements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {announcements.map((a) => (
                  <div key={a.title} className="space-y-1 border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-snug">{a.title}</p>
                      <span className="shrink-0 text-xs text-muted-foreground">{a.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{a.body}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
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
