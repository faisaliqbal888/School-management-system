"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { PersonalDetailsCard } from "@/components/account/account-security"
import { Button } from "@/components/ui/button"
import { ShieldCheck } from "lucide-react"
import Link from "next/link"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { BookOpen, Briefcase, GraduationCap, Loader2, Mail, Phone, School, Users } from "lucide-react"
import { useDashboardSummary } from "@/lib/hooks/use-dashboard"
import type { TeacherProfile } from "@/lib/auth-context"

export default function TeacherProfilePage() {
  const { ready } = useRequireRole("TEACHER")
  const { user, refreshUser } = useAuth()
  const { summary, isLoading } = useDashboardSummary()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const teacher = summary?.role === "TEACHER" ? summary : undefined
  const profile = (user?.profile ?? null) as TeacherProfile | null
  const attendanceRate = teacher?.attendance.trend.overall.rate ?? null

  const details = [
    { label: "Employee no", value: teacher?.teacher.employeeNo ?? profile?.employeeNo ?? "—" },
    { label: "Designation", value: teacher?.teacher.designation ?? profile?.designation ?? "—" },
    { label: "Department", value: teacher?.teacher.department ?? profile?.department ?? "—" },
    {
      label: "Class teacher of",
      value: profile?.classTeacherOf
        ? `${profile.classTeacherOf.name}`
        : "Not assigned",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-muted-foreground">Your staff record and this week&apos;s teaching load</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="overflow-hidden border-0 shadow-lg">
              <div className="h-28 bg-gradient-to-r from-emerald-500 to-teal-600" />
              <CardContent className="relative -mt-14 pt-0 text-center">
                <Avatar className="mx-auto h-28 w-28 border-4 border-white shadow-xl">
                  <AvatarImage src={user?.avatarUrl ?? undefined} alt={user?.name ?? "Teacher"} />
                  <AvatarFallback className="bg-emerald-100 text-3xl text-emerald-700">
                    {(user?.name ?? "T").charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <h2 className="mt-3 text-xl font-bold">{user?.name ?? "—"}</h2>
                <p className="text-sm text-muted-foreground">
                  {teacher?.teacher.designation ?? profile?.designation ?? "Teacher"}
                </p>
                <Badge className="mt-2" variant="secondary">
                  {profile?.status ? profile.status.toLowerCase() : "active"} staff
                </Badge>

                <Separator className="my-4" />

                <div className="space-y-2 text-left text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user?.email ?? "—"}</span>
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {user?.phone ?? "Not on record"}
                  </p>
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Briefcase className="h-3.5 w-3.5" />
                    {teacher?.teacher.department ?? profile?.department ?? "—"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Staff record</CardTitle>
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

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    label: "Lessons / week",
                    value: teacher?.counts.lessons ?? "—",
                    icon: BookOpen,
                    tone: "bg-emerald-50 text-emerald-600",
                  },
                  {
                    label: "Sections",
                    value: teacher?.counts.sections ?? "—",
                    icon: School,
                    tone: "bg-blue-50 text-blue-600",
                  },
                  {
                    label: "Students",
                    value: teacher?.counts.students ?? "—",
                    icon: Users,
                    tone: "bg-violet-50 text-violet-600",
                  },
                  {
                    label: "Attendance (7d)",
                    value: attendanceRate !== null ? `${attendanceRate}%` : "—",
                    icon: GraduationCap,
                    tone: "bg-amber-50 text-amber-600",
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

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Subjects you teach</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {(profile?.subjects ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No subjects recorded against your staff profile.</p>
                  ) : (
                    profile?.subjects.map((subject) => (
                      <Badge key={subject.id} variant="secondary">
                        {subject.name} · {subject.code}
                      </Badge>
                    ))
                  )}
                </CardContent>
              </Card>

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
                    Departments, designations and salary details are managed by the admin office.
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
