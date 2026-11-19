"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Settings, Bell, Lock, Database } from "lucide-react"

const settingsSections = [
  {
    icon: Settings,
    title: "General Settings",
    description: "School name, address, contact information",
  },
  {
    icon: Bell,
    title: "Notifications",
    description: "Email and SMS notification preferences",
  },
  {
    icon: Lock,
    title: "Security",
    description: "Password policy, two-factor authentication",
  },
  {
    icon: Database,
    title: "Data & Backup",
    description: "Backup settings and data management",
  },
]

export default function Page() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/20">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-teal-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold">⚙️ System Settings</h1>
            <p className="text-teal-100 mt-1">Manage system preferences and configuration</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {settingsSections.map((section) => (
              <Card key={section.title} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-green-600 shadow-lg">
                      <section.icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-gray-900">{section.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-gradient-to-r from-teal-500 to-green-600 hover:from-teal-600 hover:to-green-700 text-white">Configure</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
