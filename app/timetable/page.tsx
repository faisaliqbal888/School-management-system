"use client"

import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { WeeklyTimetable } from "@/components/timetable/weekly-timetable"
import { SchoolCalendar } from "@/components/timetable/school-calendar"
import { UpcomingClasses } from "@/components/timetable/upcoming-classes"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Grid3X3, List, Download, Plus, Clock, BookOpen, Users, MapPin } from "lucide-react"

const stats = [
  {
    title: "Today's Classes",
    value: "7",
    icon: BookOpen,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Teaching Hours",
    value: "5.5h",
    icon: Clock,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Teachers on Duty",
    value: "24",
    icon: Users,
    color: "bg-success/10 text-success",
  },
  {
    title: "Rooms in Use",
    value: "18",
    icon: MapPin,
    color: "bg-warning/10 text-warning",
  },
]

export default function TimetablePage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <Header />
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Timetable & Calendar</h1>
              <p className="text-muted-foreground">View and manage class schedules and school events.</p>
            </div>
            <div className="flex gap-2">
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
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Edit Schedule
              </Button>
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
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="timetable" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="timetable" className="gap-2">
                <Grid3X3 className="h-4 w-4" />
                Timetable
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="today" className="gap-2">
                <List className="h-4 w-4" />
                Today
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timetable" className="mt-6">
              <WeeklyTimetable />
            </TabsContent>

            <TabsContent value="calendar" className="mt-6">
              <SchoolCalendar />
            </TabsContent>

            <TabsContent value="today" className="mt-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <UpcomingClasses />
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center justify-center text-center h-[300px] space-y-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Friday, December 5, 2025</h3>
                        <p className="text-sm text-muted-foreground">Week 14 of Academic Year</p>
                      </div>
                      <div className="grid grid-cols-3 gap-6 pt-4">
                        <div>
                          <p className="text-2xl font-bold text-primary">7</p>
                          <p className="text-xs text-muted-foreground">Classes Today</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-success">2</p>
                          <p className="text-xs text-muted-foreground">Free Periods</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-warning">1</p>
                          <p className="text-xs text-muted-foreground">Events</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
