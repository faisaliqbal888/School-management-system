"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { ExamList } from "@/components/exams/exam-list"
import { MarksEntry } from "@/components/exams/marks-entry"
import { ResultsOverview } from "@/components/exams/results-overview"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ClipboardList, BarChart3, Plus, Calendar, Trophy, BookOpen, Users, Loader2 } from "lucide-react"

const stats = [
  {
    title: "Total Exams",
    value: "12",
    subtitle: "This semester",
    icon: Calendar,
    color: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
  },
  {
    title: "Upcoming",
    value: "3",
    subtitle: "In next 30 days",
    icon: BookOpen,
    color: "from-amber-500 to-amber-600",
    bgGradient: "from-amber-50 to-amber-100",
  },
  {
    title: "Average Score",
    value: "76.4%",
    subtitle: "+2.3% from last exam",
    icon: Trophy,
    color: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-50 to-emerald-100",
  },
  {
    title: "Students",
    value: "2,847",
    subtitle: "Participating",
    icon: Users,
    color: "from-purple-500 to-purple-600",
    bgGradient: "from-purple-50 to-purple-100",
  },
]

export default function AdminExamsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("exams")

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/20">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
            <h1 className="text-3xl font-bold">📝 Exams & Results Management</h1>
            <p className="text-orange-100 mt-1">Manage examinations, marks, and student results</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${stat.bgGradient}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-lg grid-cols-3 bg-gradient-to-r from-orange-100 to-red-100 p-1 rounded-lg">
              <TabsTrigger value="exams" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-md">Exams</TabsTrigger>
              <TabsTrigger value="marks" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-md">Entry Marks</TabsTrigger>
              <TabsTrigger value="results" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white rounded-md">Results Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="exams">
              <ExamList />
            </TabsContent>

            <TabsContent value="marks">
              <MarksEntry />
            </TabsContent>

            <TabsContent value="results">
              <ResultsOverview />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
