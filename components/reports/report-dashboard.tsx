"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, PieChart, TrendingUp, Download, FileText, Users, GraduationCap, CreditCard } from "lucide-react"

const reports = [
  {
    title: "Student Performance Report",
    description: "Academic performance analysis across all classes",
    icon: GraduationCap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    lastGenerated: "2 hours ago",
  },
  {
    title: "Attendance Summary",
    description: "Monthly attendance statistics and trends",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
    lastGenerated: "1 day ago",
  },
  {
    title: "Fee Collection Report",
    description: "Revenue analysis and pending payments",
    icon: CreditCard,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    lastGenerated: "3 hours ago",
  },
  {
    title: "Staff Performance",
    description: "Teacher and staff evaluation metrics",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    lastGenerated: "1 week ago",
  },
]

const quickStats = [
  { label: "Total Students", value: "1,248", trend: "+5.2%" },
  { label: "Avg. Attendance", value: "94.2%", trend: "+1.8%" },
  { label: "Fee Collection", value: "87%", trend: "+3.4%" },
  { label: "Pass Rate", value: "96.5%", trend: "+2.1%" },
]

export function ReportDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Quick Stats</h2>
          <p className="text-sm text-muted-foreground">Overview of key metrics</p>
        </div>
        <Select defaultValue="this-month">
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this-week">This Week</SelectItem>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="this-year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-bold">{stat.value}</span>
                <span className="text-sm text-emerald-600">{stat.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Available Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((report) => (
            <Card key={report.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${report.bgColor}`}>
                    <report.icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{report.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{report.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">Last generated: {report.lastGenerated}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Monthly Enrollment Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-end gap-2">
              {[65, 78, 82, 75, 88, 95, 92, 98, 105, 110, 115, 120].map((value, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                  style={{ height: `${(value / 120) * 100}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Jan</span>
              <span>Dec</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Revenue Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[200px]">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 100 100" className="transform -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-primary"
                    strokeDasharray="188.5 251.3"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-emerald-500"
                    strokeDasharray="50.3 251.3"
                    strokeDashoffset="-188.5"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="20"
                    className="text-amber-500"
                    strokeDasharray="12.6 251.3"
                    strokeDashoffset="-238.8"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-2xl font-bold">$1.2M</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-sm">Tuition (75%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm">Transport (20%)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-sm">Other (5%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
