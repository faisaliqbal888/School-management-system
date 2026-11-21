"use client"

import type { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"

/**
 * Shared shell for account-level pages. Each role keeps its own sidebar so the
 * page feels native wherever it is reached from, without duplicating the page.
 */
export default function AccountLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const pathname = usePathname()
  void pathname

  if (user?.role === "TEACHER") {
    return (
      <div className="min-h-screen bg-background">
        <TeacherSidebar />
        <div className="transition-all duration-300 lg:pl-64">
          <TeacherHeader />
          <main className="min-h-screen bg-gradient-to-br from-slate-50 to-violet-50/30 p-6">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    )
  }

  if (user?.role === "STUDENT") {
    return (
      <div className="min-h-screen bg-background">
        <StudentSidebar />
        <div className="transition-all duration-300 lg:pl-64">
          <StudentHeader />
          <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    )
  }

  if (user?.role === "PARENT") {
    return (
      <div className="min-h-screen bg-background">
        <ParentSidebar />
        <div className="transition-all duration-300 lg:pl-64">
          <ParentHeader />
          <main className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 p-6">
            <div className="mx-auto max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 p-6">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
