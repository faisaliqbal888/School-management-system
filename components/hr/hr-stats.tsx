"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, DollarSign, TrendingUp } from "lucide-react"

const stats = [
  {
    title: "Total Employees",
    value: "86",
    change: "48 teaching, 38 non-teaching",
    icon: Users,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Open Positions",
    value: "5",
    change: "3 teaching, 2 admin",
    icon: Briefcase,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Monthly Payroll",
    value: "$425,800",
    change: "For December 2024",
    icon: DollarSign,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Avg. Salary",
    value: "$58,200",
    change: "+4.5% YoY",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
]

const departments = [
  { name: "Teaching Staff", count: 48, payroll: 285000 },
  { name: "Administration", count: 12, payroll: 58000 },
  { name: "Support Staff", count: 18, payroll: 54000 },
  { name: "Security", count: 8, payroll: 28800 },
]

export function HRStats() {
  const maxPayroll = Math.max(...departments.map((d) => d.payroll))

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
          <CardTitle className="text-base font-semibold">Payroll by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {departments.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{dept.name}</span>
                  <span className="text-muted-foreground">
                    {dept.count} staff (${dept.payroll.toLocaleString()})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(dept.payroll / maxPayroll) * 100}%` }}
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
