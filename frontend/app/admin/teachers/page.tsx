"use client"

import { useState } from "react"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { TeacherTable } from "@/components/teachers/teacher-table"
import { AddTeacherModal } from "@/components/teachers/add-teacher-modal"
import { DepartmentStats } from "@/components/teachers/department-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export default function AdminTeachersPage() {
  const { user, isLoading, isAuthenticated } = useAuth()

  const { ready } = useRequireRole("ADMIN")

  if (!ready) return <FullPageLoader />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/20">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">👨‍🏫 Teachers & Staff Management</h1>
              <p className="text-purple-100 mt-1">Manage all teaching faculty and staff members</p>
            </div>
            <AddTeacherModal />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-sm grid-cols-2 bg-gradient-to-r from-purple-100 to-pink-100 p-1 rounded-lg">
              <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-md">Overview</TabsTrigger>
              <TabsTrigger value="all-teachers" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white rounded-md">All Teachers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <DepartmentStats />
            </TabsContent>

            <TabsContent value="all-teachers">
              <TeacherTable />
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
