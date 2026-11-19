"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, BarChart3, Download, FileText, Calendar } from "lucide-react"

const reports = [
  { title: "Student Performance", icon: BarChart3, date: "Updated today" },
  { title: "Attendance Report", icon: Calendar, date: "Updated today" },
  { title: "Financial Summary", icon: FileText, date: "Updated yesterday" },
  { title: "Staff Directory", icon: FileText, date: "Updated 2 days ago" },
]

export default function AdminReportsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()

  const { ready } = useRequireRole("ADMIN")

  if (!ready) return <FullPageLoader />

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-600 text-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold">📊 Reports & Analytics</h1>
            <p className="text-rose-100 mt-1">Generate and view comprehensive system reports</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {reports.map((report) => (
              <Card key={report.title} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-rose-50 to-pink-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-rose-500 to-pink-600">
                        <report.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-gray-900">{report.title}</span>
                    </CardTitle>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">{report.date}</p>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white">
                    <Download className="mr-2 h-4 w-4" />
                    Download Report
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
