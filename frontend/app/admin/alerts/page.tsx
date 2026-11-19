"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, AlertCircle, AlertOctagon, Bell } from "lucide-react"

const alerts = [
  {
    title: "Low Attendance Alert",
    message: "15 students have attendance below 75%",
    severity: "warning",
    time: "2 hours ago",
    icon: AlertCircle,
  },
  {
    title: "Fee Payment Overdue",
    message: "42 students have overdue fee payments",
    severity: "critical",
    time: "1 day ago",
    icon: AlertTriangle,
  },
  {
    title: "Leave Quota Alert",
    message: "3 teachers are approaching annual leave limit",
    severity: "warning",
    time: "2 days ago",
    icon: AlertOctagon,
  },
  {
    title: "Low Book Stock",
    message: "8 books have stock below 5 copies",
    severity: "info",
    time: "3 days ago",
    icon: AlertCircle,
  },
  {
    title: "Hostel Occupancy High",
    message: "Hostel occupancy at 95% capacity",
    severity: "warning",
    time: "4 days ago",
    icon: AlertOctagon,
  },
]

const severityColors = {
  critical: "bg-red-100 text-red-800 border-red-300",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
  info: "bg-blue-100 text-blue-800 border-blue-300",
}

export default function Page() {
  const { user, isLoading, isAuthenticated } = useAuth()

  const { ready } = useRequireRole("ADMIN")

  if (!ready) return <FullPageLoader />

  const criticalCount = alerts.filter(a => a.severity === "critical").length
  const warningCount = alerts.filter(a => a.severity === "warning").length
  const infoCount = alerts.filter(a => a.severity === "info").length

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">System Alerts</h1>
              <p className="text-muted-foreground">Monitor and manage system alerts and notifications</p>
            </div>
            <Button variant="outline">Mark All as Read</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Critical</p>
                    <p className="text-2xl font-bold">{criticalCount}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Warning</p>
                    <p className="text-2xl font-bold">{warningCount}</p>
                  </div>
                  <AlertOctagon className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Info</p>
                    <p className="text-2xl font-bold">{infoCount}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>All Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-4 p-4 border-l-4 rounded-lg ${
                      severityColors[alert.severity as keyof typeof severityColors]
                    }`}
                  >
                    <alert.icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="text-sm mt-1">{alert.message}</p>
                      <p className="text-xs mt-2 opacity-75">{alert.time}</p>
                    </div>
                    <Badge className={severityColors[alert.severity as keyof typeof severityColors]}>
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

/** Shared loading fallback while the session is being verified. */
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
