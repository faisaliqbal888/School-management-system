"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Calendar, FileText, AlertTriangle } from "lucide-react"

const notifications = [
  {
    id: 1,
    title: "Final Exam Schedule Released",
    message: "Check your timetable for December exams starting Dec 18th",
    type: "exam",
    time: "2 hours ago",
    read: false,
  },
  {
    id: 2,
    title: "Fee Payment Reminder",
    message: "Your December tuition fee is due on Dec 15th",
    type: "fee",
    time: "1 day ago",
    read: false,
  },
  {
    id: 3,
    title: "Holiday Notice",
    message: "School will remain closed on Dec 25th for Christmas",
    type: "event",
    time: "2 days ago",
    read: true,
  },
  {
    id: 4,
    title: "Mid-Term Results Published",
    message: "Your mid-term examination results are now available",
    type: "result",
    time: "1 week ago",
    read: true,
  },
]

const iconMap = {
  exam: Calendar,
  fee: AlertTriangle,
  event: Bell,
  result: FileText,
}

const colorMap = {
  exam: "bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400",
  fee: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
  event: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  result: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
}

export function StudentNotifications() {
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">Notifications</CardTitle>
          {unreadCount > 0 && <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {notifications.map((notification) => {
          const Icon = iconMap[notification.type as keyof typeof iconMap]
          return (
            <div
              key={notification.id}
              className={`p-3 rounded-xl flex items-start gap-3 transition-colors cursor-pointer hover:bg-muted/50 ${
                !notification.read ? "bg-primary/5" : ""
              }`}
            >
              <div className={`p-2 rounded-lg ${colorMap[notification.type as keyof typeof colorMap]}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!notification.read ? "font-semibold" : "font-medium"}`}>
                    {notification.title}
                  </p>
                  {!notification.read && <div className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">{notification.message}</p>
                <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
