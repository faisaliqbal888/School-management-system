"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, GraduationCap, Clock, Award } from "lucide-react"

const stats = [
  {
    title: "Total Teachers",
    value: "48",
    change: "+3 this month",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Departments",
    value: "8",
    change: "All active",
    icon: GraduationCap,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Avg. Experience",
    value: "9.5 yrs",
    change: "Highly qualified",
    icon: Clock,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "On Leave",
    value: "3",
    change: "2 returning soon",
    icon: Award,
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
  },
]

const departments = [
  { name: "Mathematics", teachers: 8, color: "bg-blue-500" },
  { name: "Science", teachers: 10, color: "bg-emerald-500" },
  { name: "English", teachers: 6, color: "bg-purple-500" },
  { name: "Computer Science", teachers: 5, color: "bg-amber-500" },
  { name: "History", teachers: 4, color: "bg-rose-500" },
  { name: "Arts", teachers: 6, color: "bg-cyan-500" },
  { name: "Physical Education", teachers: 4, color: "bg-orange-500" },
  { name: "Languages", teachers: 5, color: "bg-pink-500" },
]

export function DepartmentStats() {
  const maxTeachers = Math.max(...departments.map((d) => d.teachers))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Teachers by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.name}</span>
                  <span className="text-muted-foreground">{dept.teachers} teachers</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${dept.color} transition-all duration-500`}
                    style={{ width: `${(dept.teachers / maxTeachers) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
