"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, GraduationCap, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cn } from "@/lib/utils"

const stats = [
  {
    title: "Total Students",
    value: "2,847",
    change: "+12.5%",
    trend: "up",
    icon: GraduationCap,
    color: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
  },
  {
    title: "Total Teachers",
    value: "156",
    change: "+3.2%",
    trend: "up",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
  },
  {
    title: "Fee Collection",
    value: "$284,500",
    change: "+8.1%",
    trend: "up",
    icon: CreditCard,
    color: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-50 to-emerald-100",
  },
  {
    title: "Attendance Rate",
    value: "94.2%",
    change: "-1.3%",
    trend: "down",
    icon: TrendingUp,
    color: "from-amber-500 to-amber-600",
    bgGradient: "from-amber-50 to-amber-100",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className={cn(
            "overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 group bg-gradient-to-br",
            stat.bgGradient
          )}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-3 flex-1">
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{stat.title}</p>
                <p className="text-4xl font-bold tracking-tight text-gray-900">{stat.value}</p>
                <div className="flex items-center gap-1 pt-1">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="h-4 w-4 text-emerald-500 font-bold" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-500 font-bold" />
                  )}
                  <span
                    className={cn("text-sm font-bold", stat.trend === "up" ? "text-emerald-600" : "text-red-600")}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500">vs last month</span>
                </div>
              </div>
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br transition-transform duration-300 group-hover:scale-110 shadow-lg flex-shrink-0 ml-4",
                  stat.color,
                )}
              >
                <stat.icon className="h-8 w-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
