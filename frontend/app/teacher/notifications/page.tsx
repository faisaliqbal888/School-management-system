"use client"

import { useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bell,
  Calendar,
  FileText,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Megaphone,
  BookOpen,
  Settings,
  Trash2,
  Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

const notifications = [
  {
    id: 1,
    type: "assignment",
    title: "Assignment Submissions",
    message: "15 students have submitted the Math homework for Class 10-A",
    time: "10 minutes ago",
    read: false,
    priority: "normal",
    icon: FileText,
    color: "text-blue-600 bg-blue-100",
  },
  {
    id: 2,
    type: "attendance",
    title: "Low Attendance Alert",
    message: "Class 10-B has 70% attendance today. 13 students are absent.",
    time: "30 minutes ago",
    read: false,
    priority: "high",
    icon: AlertCircle,
    color: "text-red-600 bg-red-100",
  },
  {
    id: 3,
    type: "meeting",
    title: "Staff Meeting Reminder",
    message: "Department meeting scheduled for tomorrow at 2:00 PM in Conference Room A",
    time: "1 hour ago",
    read: false,
    priority: "normal",
    icon: Calendar,
    color: "text-purple-600 bg-purple-100",
  },
  {
    id: 4,
    type: "result",
    title: "Results Published",
    message: "Mid-term results for Class 9-A have been published successfully",
    time: "2 hours ago",
    read: true,
    priority: "normal",
    icon: CheckCircle2,
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    id: 5,
    type: "announcement",
    title: "School Announcement",
    message: "Annual Day celebrations scheduled for December 20th. All teachers are requested to participate.",
    time: "3 hours ago",
    read: true,
    priority: "normal",
    icon: Megaphone,
    color: "text-amber-600 bg-amber-100",
  },
  {
    id: 6,
    type: "parent",
    title: "Parent Meeting Request",
    message: "Mr. Rajesh Verma has requested a meeting to discuss Rahul's progress",
    time: "Yesterday",
    read: true,
    priority: "normal",
    icon: Users,
    color: "text-cyan-600 bg-cyan-100",
  },
  {
    id: 7,
    type: "syllabus",
    title: "Syllabus Update",
    message: "New syllabus for Class 12 Mathematics has been uploaded. Please review.",
    time: "Yesterday",
    read: true,
    priority: "normal",
    icon: BookOpen,
    color: "text-indigo-600 bg-indigo-100",
  },
  {
    id: 8,
    type: "system",
    title: "System Maintenance",
    message: "Scheduled maintenance on Saturday from 2 AM to 6 AM. Some features may be unavailable.",
    time: "2 days ago",
    read: true,
    priority: "low",
    icon: Settings,
    color: "text-slate-600 bg-slate-100",
  },
]

export default function TeacherNotificationsPage() {
  const [notificationList, setNotificationList] = useState(notifications)
  const [filter, setFilter] = useState("all")

  const unreadCount = notificationList.filter((n) => !n.read).length

  const filteredNotifications = notificationList.filter((n) => {
    if (filter === "all") return true
    if (filter === "unread") return !n.read
    return n.type === filter
  })

  const markAsRead = (id: number) => {
    setNotificationList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: number) => {
    setNotificationList((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <TeacherSidebar />
      <div className="pl-64">
        <TeacherHeader />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with alerts and announcements</p>
            </div>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && <Badge className="bg-emerald-600 text-white">{unreadCount} unread</Badge>}
              <Button variant="outline" onClick={markAllAsRead} className="gap-2 bg-transparent">
                <Check className="h-4 w-4" />
                Mark all as read
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-4">
            {/* Quick Stats */}
            <div className="lg:col-span-4 grid gap-4 md:grid-cols-4">
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Bell className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{notificationList.length}</p>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{unreadCount}</p>
                    <p className="text-sm text-muted-foreground">Unread</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{notificationList.filter((n) => n.priority === "high").length}</p>
                    <p className="text-sm text-muted-foreground">High Priority</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-md">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{notificationList.filter((n) => n.type === "meeting").length}</p>
                    <p className="text-sm text-muted-foreground">Meetings</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notifications List */}
            <div className="lg:col-span-4">
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b">
                  <Tabs value={filter} onValueChange={setFilter} className="w-full">
                    <TabsList className="grid w-full grid-cols-5">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="unread">Unread</TabsTrigger>
                      <TabsTrigger value="assignment">Assignments</TabsTrigger>
                      <TabsTrigger value="meeting">Meetings</TabsTrigger>
                      <TabsTrigger value="announcement">Announcements</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {filteredNotifications.length > 0 ? (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "flex items-start gap-4 p-4 transition-colors hover:bg-slate-50",
                            !notification.read && "bg-emerald-50/50",
                          )}
                        >
                          <div
                            className={cn(
                              "h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0",
                              notification.color,
                            )}
                          >
                            <notification.icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-medium flex items-center gap-2">
                                  {notification.title}
                                  {!notification.read && <span className="h-2 w-2 rounded-full bg-emerald-600" />}
                                  {notification.priority === "high" && (
                                    <Badge className="bg-red-100 text-red-700">Urgent</Badge>
                                  )}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-xs text-muted-foreground">{notification.time}</span>
                                {!notification.read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => markAsRead(notification.id)}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No notifications found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
