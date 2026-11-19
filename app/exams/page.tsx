"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ExamList } from "@/components/exams/exam-list"
import { MarksEntry } from "@/components/exams/marks-entry"
import { ResultsOverview } from "@/components/exams/results-overview"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, ClipboardList, BarChart3, Plus, Calendar, Trophy, BookOpen, Users } from "lucide-react"

const stats = [
  {
    title: "Total Exams",
    value: "12",
    subtitle: "This semester",
    icon: Calendar,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Upcoming",
    value: "3",
    subtitle: "In next 30 days",
    icon: BookOpen,
    color: "bg-warning/10 text-warning",
  },
  {
    title: "Average Score",
    value: "76.4%",
    subtitle: "+2.3% from last exam",
    icon: Trophy,
    color: "bg-success/10 text-success",
  },
  {
    title: "Students",
    value: "2,847",
    subtitle: "Participating",
    icon: Users,
    color: "bg-accent/10 text-accent",
  },
]

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState("exams")

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <Header />
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Exams & Results</h1>
              <p className="text-muted-foreground">Manage examinations, enter marks, and analyze results.</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Exam
            </Button>
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
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="exams" className="gap-2">
                <FileText className="h-4 w-4" />
                Exams
              </TabsTrigger>
              <TabsTrigger value="marks" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Marks Entry
              </TabsTrigger>
              <TabsTrigger value="results" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="exams" className="mt-6">
              <ExamList />
            </TabsContent>

            <TabsContent value="marks" className="mt-6">
              <MarksEntry />
            </TabsContent>

            <TabsContent value="results" className="mt-6">
              <ResultsOverview />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
