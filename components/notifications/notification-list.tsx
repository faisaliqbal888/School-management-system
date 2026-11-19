"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, GraduationCap, Calendar, AlertTriangle, CheckCircle, Clock, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

const notifications = [
  {
    id: 1,
    title: "Fee Payment Reminder",
    message: "15 students have pending fee payments for December 2024.",
    type: "payment",
    icon: CreditCard,
    time: "2 hours ago",
    read: false,
    priority: "high",
  },
  {
    id: 2,
    title: "New Student Enrollment",
    message: "3 new students have been enrolled in Grade 10-A.",
    type: "enrollment",
    icon: GraduationCap,
    time: "5 hours ago",
    read: false,
    priority: "medium",
  },
  {
    id: 3,
    title: "Exam Schedule Published",
    message: "Final exam schedule for December has been published.",
    type: "academic",
    icon: Calendar,
    time: "1 day ago",
    read: true,
    priority: "low",
  },
  {
    id: 4,
    title: "Low Inventory Alert",
    message: "Whiteboard markers are running low. Current stock: 85 boxes.",
    type: "alert",
    icon: AlertTriangle,
    time: "1 day ago",
    read: true,
    priority: "medium",
  },
  {
    id: 5,
    title: "Attendance Report Ready",
    message: "November attendance report is ready for review.",
    type: "report",
    icon: CheckCircle,
    time: "2 days ago",
    read: true,
    priority: "low",
  },
  {
    id: 6,
    title: "Vehicle Maintenance Due",
    message: "Bus #104 maintenance is overdue. Please schedule service.",
    type: "alert",
    icon: AlertTriangle,
    time: "3 days ago",
    read: true,
    priority: "high",
  },
]

export function NotificationList() {
  const [activeTab, setActiveTab] = useState("all")

  const filteredNotifications =
    activeTab === "all"
      ? notifications
      : activeTab === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications.filter((n) => n.type === activeTab)

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {notifications.filter((n) => !n.read).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="payment">Payments</TabsTrigger>
          <TabsTrigger value="alert">Alerts</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <Card
            key={notification.id}
            className={cn(
              "border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer",
              !notification.read && "bg-primary/5 border-l-4 border-l-primary",
            )}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    "p-2.5 rounded-xl",
                    notification.priority === "high"
                      ? "bg-rose-500/10"
                      : notification.priority === "medium"
                        ? "bg-amber-500/10"
                        : "bg-emerald-500/10",
                  )}
                >
                  <notification.icon
                    className={cn(
                      "h-5 w-5",
                      notification.priority === "high"
                        ? "text-rose-600"
                        : notification.priority === "medium"
                          ? "text-amber-600"
                          : "text-emerald-600",
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {!notification.read && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">New</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{notification.time}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
