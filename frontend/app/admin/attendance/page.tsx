"use client"

import { useState } from "react"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { AttendanceMarking } from "@/components/attendance/attendance-marking"
import { AttendanceReport } from "@/components/attendance/attendance-report"
import { AttendanceCalendar } from "@/components/attendance/attendance-calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function AdminAttendancePage() {
  const { user, isLoading, isAuthenticated } = useAuth()

  const { ready } = useRequireRole("ADMIN")

  if (!ready) return <FullPageLoader />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/20">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold">📋 Attendance Management</h1>
            <p className="text-green-100 mt-1">Track and manage student attendance across all classes</p>
          </div>

          <Tabs defaultValue="marking" className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3 bg-gradient-to-r from-green-100 to-emerald-100 p-1 rounded-lg">
              <TabsTrigger value="marking" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-md">Mark Attendance</TabsTrigger>
              <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-md">Calendar</TabsTrigger>
              <TabsTrigger value="report" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white rounded-md">Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="marking">
              <AttendanceMarking />
            </TabsContent>

            <TabsContent value="calendar">
              <AttendanceCalendar />
            </TabsContent>

            <TabsContent value="report">
              <AttendanceReport />
            </TabsContent>
          </Tabs>
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
