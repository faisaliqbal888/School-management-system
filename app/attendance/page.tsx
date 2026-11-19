"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { AttendanceMarking } from "@/components/attendance/attendance-marking"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { AttendanceReport } from "@/components/attendance/attendance-report"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CheckCircle2, XCircle, Clock, Percent } from "lucide-react"

const stats = [
  {
    title: "Present Today",
    value: "2,680",
    percentage: "94.1%",
    icon: CheckCircle2,
    color: "bg-success/10 text-success",
  },
  {
    title: "Absent Today",
    value: "120",
    percentage: "4.2%",
    icon: XCircle,
    color: "bg-destructive/10 text-destructive",
  },
  {
    title: "Late Arrivals",
    value: "47",
    percentage: "1.7%",
    icon: Clock,
    color: "bg-warning/10 text-warning",
  },
  {
    title: "Monthly Average",
    value: "93.8%",
    percentage: "+1.2%",
    icon: Percent,
    color: "bg-primary/10 text-primary",
  },
]

export default function AttendancePage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <Header />
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
              <p className="text-muted-foreground">Track and manage daily attendance records.</p>
            </div>
            <div className="flex gap-3">
              <Select defaultValue="8-a">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6-a">Class 6-A</SelectItem>
                  <SelectItem value="6-b">Class 6-B</SelectItem>
                  <SelectItem value="7-a">Class 7-A</SelectItem>
                  <SelectItem value="7-b">Class 7-B</SelectItem>
                  <SelectItem value="8-a">Class 8-A</SelectItem>
                  <SelectItem value="8-b">Class 8-B</SelectItem>
                  <SelectItem value="9-a">Class 9-A</SelectItem>
                  <SelectItem value="9-b">Class 9-B</SelectItem>
                  <SelectItem value="10-a">Class 10-A</SelectItem>
                  <SelectItem value="10-b">Class 10-B</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="today">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="custom">Custom Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-bold">{stat.value}</p>
                        <span className="text-xs text-muted-foreground">{stat.percentage}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            <AttendanceMarking />
            <AttendanceCalendar />
          </div>

          {/* Reports */}
          <AttendanceReport />
        </main>
      </div>
    </div>
  )
}
