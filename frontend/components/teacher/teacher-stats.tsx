"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, ClipboardCheck, FileText, Calendar } from "lucide-react"

const stats = [
  {
    title: "Total Students",
    value: "156",
    subtitle: "Across 4 classes",
    icon: Users,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Today's Classes",
    value: "5",
    subtitle: "2 completed",
    icon: Calendar,
    color: "from-blue-500 to-cyan-500",
  },
  {
    title: "Pending Attendance",
    value: "3",
    subtitle: "Classes to mark",
    icon: ClipboardCheck,
    color: "from-amber-500 to-orange-500",
  },
  {
    title: "Pending Results",
    value: "2",
    subtitle: "Exams to grade",
    icon: FileText,
    color: "from-violet-500 to-purple-500",
  },
]

export function TeacherStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden border-0 shadow-lg shadow-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
