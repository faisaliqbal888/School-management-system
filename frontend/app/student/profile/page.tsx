"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  UserRound,
} from "lucide-react"
import { useDashboardSummary } from "@/lib/hooks/use-dashboard"
import { PersonalDetailsCard } from "@/components/account/account-security"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"
import Link from "next/link"

export default function StudentProfilePage() {
  const { ready } = useRequireRole("STUDENT")
  const { user, refreshUser } = useAuth()
  const { summary, isLoading } = useDashboardSummary()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const learner = summary?.role === "STUDENT" ? summary : undefined
  const me = learner?.students[0]
  const profile = (user?.profile ?? null) as
    | { admissionNo?: string; rollNo?: string | null; className?: string | null; sectionName?: string | null; status?: string }
    | null

  const attendanceRate = learner?.attendance.trend.overall.rate ?? null
  const average =
    learner && learner.results.length > 0
      ? Math.round(
          learner.results.reduce((sum, result) => sum + (result.percent ?? 0), 0) / learner.results.length,
        )
      : null

  const details = [
    { label: "Admission no", value: me?.admissionNo ?? profile?.admissionNo ?? "—" },
    { label: "Roll no", value: me?.rollNo ?? profile?.rollNo ?? "—" },
    { label: "Class", value: me ? `${me.className}-${me.sectionName}` : profile?.className ?? "—" },
    { label: "Status", value: (profile?.status ?? "ACTIVE").toLowerCase() },
  ]

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <StudentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Your details as held by the school office</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-28 bg-gradient-to-r from-blue-600 to-cyan-600" />
              <CardContent className="relative -mt-14 pt-0 text-center">
                <Avatar className="mx-auto h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={me?.avatarUrl ?? undefined} alt={me?.name ?? user?.name ?? "Student"} />
                  <AvatarFallback className="bg-blue-100 text-3xl text-blue-600">
                    {(me?.name ?? user?.name ?? "S").charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <h2 className="mt-3 text-xl font-bold">{me?.name ?? user?.name ?? "—"}</h2>
                <p className="text-sm text-muted-foreground">
                  {me ? `${me.className}-${me.sectionName}` : "—"}
                </p>
                <Badge className="mt-2" variant="secondary">
                  Student
                </Badge>

                <Separator className="my-4" />

                <div className="space-y-2 text-left text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{me?.email ?? user?.email ?? "—"}</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {user?.phone ?? "Not on record"}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" />
                    Admission {me?.admissionNo ?? profile?.admissionNo ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">School record</CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : (
                    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      {details.map((detail) => (
                        <div key={detail.label}>
                          <dt className="text-xs text-muted-foreground">{detail.label}</dt>
                          <dd className="truncate font-medium">{detail.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}
                </CardContent>
              </Card>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  {
                    label: "Attendance (7d)",
                    value: attendanceRate !== null ? `${attendanceRate}%` : "—",
                    icon: ClipboardCheck,
                    tone: "bg-blue-50 text-blue-600",
                  },
                  {
                    label: "Average score",
                    value: average !== null ? `${average}%` : "—",
                    icon: GraduationCap,
                    tone: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    label: "Subjects",
                    value: learner?.counts.subjects ?? "—",
                    icon: BookOpen,
                    tone: "bg-violet-50 text-violet-600",
                  },
                ].map((stat) => (
                  <Card key={stat.label}>
                    <CardContent className="flex items-center gap-3 p-4">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.tone}`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="text-lg font-bold">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <PersonalDetailsCard
                initialName={user?.name ?? ""}
                initialPhone={user?.phone ?? null}
                email={user?.email ?? ""}
                onSaved={refreshUser}
              />

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Need another change?</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                  <span>
                    Class, section and guardian details can only be edited by the school office.
                    Password and signed-in devices live under Security.
                  </span>
                  <Link href="/account/security">
                    <Button variant="outline" size="sm">
                      <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> Security settings
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
