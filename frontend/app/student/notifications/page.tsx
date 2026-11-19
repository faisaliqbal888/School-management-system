"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Bell, Calendar, FileText, AlertTriangle, CheckCircle2, Megaphone } from "lucide-react"

const notifications = [
  {
    id: 1,
    title: "Final Exam Schedule Released",
    message:
      "The final examination schedule for December 2024 has been released. Please check your timetable for exam dates starting from Dec 18th. Make sure to bring your admit card and required stationery.",
    type: "exam",
    priority: "high",
    time: "2 hours ago",
    date: "Dec 6, 2024",
    read: false,
  },
  {
    id: 2,
    title: "Fee Payment Reminder",
    message:
      "Your December tuition fee of $450 is due on Dec 15th, 2024. Please make the payment before the due date to avoid late fees.",
    type: "fee",
    priority: "high",
    time: "1 day ago",
    date: "Dec 5, 2024",
    read: false,
  },
  {
    id: 3,
    title: "Holiday Notice - Christmas",
    message: "School will remain closed on December 25th, 2024 for Christmas. Classes will resume on December 26th.",
    type: "event",
    priority: "medium",
    time: "2 days ago",
    date: "Dec 4, 2024",
    read: true,
  },
  {
    id: 4,
    title: "Mid-Term Results Published",
    message:
      "Your mid-term examination results are now available. You can view your detailed grade card from the Results section.",
    type: "result",
    priority: "medium",
    time: "1 week ago",
    date: "Nov 29, 2024",
    read: true,
  },
  {
    id: 5,
    title: "Annual Sports Day",
    message:
      "Annual Sports Day will be held on December 20th. All students are encouraged to participate. Registration for events closes on Dec 15th.",
    type: "event",
    priority: "low",
    time: "1 week ago",
    date: "Nov 28, 2024",
    read: true,
  },
]

const iconMap = {
  exam: Calendar,
  fee: AlertTriangle,
  event: Megaphone,
  result: FileText,
}

const colorMap = {
  exam: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  fee: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  event: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  result: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
}

export default function StudentNotificationsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [notificationList, setNotificationList] = useState(notifications)

  const { ready } = useRequireRole("STUDENT")

  const markAllAsRead = () => {
    setNotificationList((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const markAsRead = (id: number) => {
    setNotificationList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  if (!ready) return <FullPageLoader />

  const unreadCount = notificationList.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <StudentHeader />
        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground">Stay updated with school announcements</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark All as Read ({unreadCount})
              </Button>
            )}
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && <Badge className="ml-1 h-5 w-5 p-0 text-[10px]">{unreadCount}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="exam">Exams</TabsTrigger>
              <TabsTrigger value="event">Events</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4 space-y-3">
              {notificationList.map((notification) => {
                const Icon = iconMap[notification.type as keyof typeof iconMap]
                return (
                  <Card
                    key={notification.id}
                    className={`border-0 shadow-md cursor-pointer transition-all hover:shadow-lg ${
                      !notification.read ? "bg-primary/5 border-l-4 border-l-primary" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className={`p-3 rounded-xl ${colorMap[notification.type as keyof typeof colorMap]} h-fit`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4
                              className={`font-semibold ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {notification.priority === "high" && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Important
                                </Badge>
                              )}
                              {!notification.read && <div className="h-2 w-2 rounded-full bg-primary" />}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {notification.time} | {notification.date}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </TabsContent>

            <TabsContent value="unread" className="mt-4 space-y-3">
              {notificationList
                .filter((n) => !n.read)
                .map((notification) => {
                  const Icon = iconMap[notification.type as keyof typeof iconMap]
                  return (
                    <Card
                      key={notification.id}
                      className="border-0 shadow-md cursor-pointer transition-all hover:shadow-lg bg-primary/5 border-l-4 border-l-primary"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          <div
                            className={`p-3 rounded-xl ${colorMap[notification.type as keyof typeof colorMap]} h-fit`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{notification.title}</h4>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{notification.message}</p>
                            <p className="text-xs text-muted-foreground">{notification.time}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              {notificationList.filter((n) => !n.read).length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>All caught up! No unread notifications.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="exam" className="mt-4 space-y-3">
              {notificationList
                .filter((n) => n.type === "exam")
                .map((notification) => (
                  <Card key={notification.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="p-3 rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-950 h-fit">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{notification.date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="event" className="mt-4 space-y-3">
              {notificationList
                .filter((n) => n.type === "event")
                .map((notification) => (
                  <Card key={notification.id} className="border-0 shadow-md">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        <div className="p-3 rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 h-fit">
                          <Megaphone className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">{notification.title}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <p className="text-xs text-muted-foreground">{notification.date}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
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
