"use client"

import { Card, CardContent } from "@/components/ui/card"
import { ClipboardCheck, FileText, CreditCard, Calendar, TrendingUp, TrendingDown } from "lucide-react"

const stats = [
  {
    title: "Overall Attendance",
    value: "92%",
    change: "+2.5%",
    trend: "up",
    icon: ClipboardCheck,
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50 dark:bg-blue-950",
  },
  {
    title: "Current GPA",
    value: "3.75",
    change: "+0.15",
    trend: "up",
    icon: FileText,
    color: "from-emerald-500 to-teal-500",
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
  },
  {
    title: "Pending Fees",
    value: "$450",
    change: "Due: Dec 15",
    trend: "neutral",
    icon: CreditCard,
    color: "from-amber-500 to-orange-500",
    bgColor: "bg-amber-50 dark:bg-amber-950",
  },
  {
    title: "Upcoming Exams",
    value: "3",
    change: "Next: Math",
    trend: "neutral",
    icon: Calendar,
    color: "from-violet-500 to-purple-500",
    bgColor: "bg-violet-50 dark:bg-violet-950",
  },
]

export function StudentStats() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="overflow-hidden border-0 shadow-lg shadow-primary/5">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                <div className="flex items-center gap-1">
                  {stat.trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                  {stat.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span
                    className={`text-sm ${
                      stat.trend === "up"
                        ? "text-emerald-600"
                        : stat.trend === "down"
                          ? "text-red-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
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
