"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Users, AlertTriangle, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Books",
    value: "12,450",
    change: "+125 this month",
    icon: BookOpen,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Books Issued",
    value: "842",
    change: "Currently out",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Overdue Books",
    value: "23",
    change: "Need attention",
    icon: AlertTriangle,
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
  },
  {
    title: "Monthly Issues",
    value: "1,250",
    change: "+18% vs last month",
    icon: TrendingUp,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
]

export function LibraryStats() {
  return (
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
  )
}
