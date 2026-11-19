"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, GraduationCap, Clock, Award, ArrowRight } from "lucide-react"
import { formatPKRCompact } from "@/lib/format"
import type { TeacherListItem } from "@/lib/hooks/use-teachers"

interface DepartmentStatsProps {
  teachers: TeacherListItem[]
  total: number
  isLoading?: boolean
  onSelectDepartment?: (department: string) => void
}

const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
]

export function DepartmentStats({
  teachers,
  total,
  isLoading = false,
  onSelectDepartment,
}: DepartmentStatsProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-none shadow-sm">
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-3 w-28" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="space-y-4 p-6">
            <Skeleton className="h-5 w-40" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── derive from the live list ──────────────────────────────
  const byDepartment = new Map<string, { count: number; studentCount: number; salarySum: number }>()
  for (const t of teachers) {
    const entry = byDepartment.get(t.department) ?? { count: 0, studentCount: 0, salarySum: 0 }
    entry.count += 1
    entry.studentCount += t.studentCount
    entry.salarySum += t.baseSalary
    byDepartment.set(t.department, entry)
  }

  const departments = [...byDepartment.entries()]
    .map(([name, v]) => ({
      name,
      teachers: v.count,
      studentCount: v.studentCount,
      avgSalary: v.count > 0 ? Math.round(v.salarySum / v.count) : 0,
    }))
    .sort((a, b) => b.teachers - a.teachers)

  const onLeave = teachers.filter((t) => t.status === "ON_LEAVE").length
  const active = teachers.filter((t) => t.status === "ACTIVE").length
  const classTeachers = teachers.filter((t) => t.classTeacherOf).length

  const avgYears =
    teachers.length === 0
      ? 0
      : teachers.reduce((sum, t) => {
          const joined = new Date(t.joiningDate).getTime()
          const years = (Date.now() - joined) / (1000 * 60 * 60 * 24 * 365)
          return sum + Math.max(0, years)
        }, 0) / teachers.length

  const maxTeachers = Math.max(1, ...departments.map((d) => d.teachers))

  const stats = [
    {
      title: "Total Teachers",
      value: String(total),
      change: `${active} active on this page`,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Departments",
      value: String(departments.length),
      change: `${classTeachers} class teachers`,
      icon: GraduationCap,
      color: "text-emerald-600",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Avg. Experience",
      value: `${avgYears.toFixed(1)} yrs`,
      change: "Since joining date",
      icon: Clock,
      color: "text-amber-600",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "On Leave",
      value: String(onLeave),
      change: onLeave === 0 ? "Full attendance" : "Cover needed",
      icon: Award,
      color: "text-rose-600",
      bgColor: "bg-rose-500/10",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="border-none shadow-sm transition-shadow hover:shadow-md"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Teachers by department</CardTitle>
          <span className="text-xs text-muted-foreground">this page</span>
        </CardHeader>
        <CardContent className="space-y-4">
          {departments.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No teachers to summarise yet.
            </p>
          ) : (
            departments.map((dept, index) => (
              <button
                key={dept.name}
                type="button"
                onClick={() => onSelectDepartment?.(dept.name)}
                className="group block w-full text-left"
              >
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 font-medium group-hover:text-primary">
                    {dept.name}
                    <ArrowRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </span>
                  <span className="text-muted-foreground">
                    {dept.teachers} teacher{dept.teachers === 1 ? "" : "s"} ·{" "}
                    {dept.studentCount} students · avg {formatPKRCompact(dept.avgSalary)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${BAR_COLORS[index % BAR_COLORS.length]} transition-all`}
                    style={{ width: `${(dept.teachers / maxTeachers) * 100}%` }}
                  />
                </div>
              </button>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
