"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Send, Megaphone, Users, Bell, Calendar, FileText } from "lucide-react"

const sentNotifications = [
  {
    id: 1,
    title: "Final Exam Schedule Released",
    message: "The final examination schedule for December 2024 has been released...",
    target: "All Students",
    channel: "In-App",
    sentAt: "Dec 6, 2024 10:30 AM",
    readBy: 145,
    totalRecipients: 180,
  },
  {
    id: 2,
    title: "Fee Payment Reminder",
    message: "This is a reminder that December tuition fees are due on Dec 15th...",
    target: "Class 10 Students",
    channel: "In-App + Email",
    sentAt: "Dec 5, 2024 9:00 AM",
    readBy: 52,
    totalRecipients: 64,
  },
  {
    id: 3,
    title: "Parent-Teacher Meeting",
    message: "Parent-Teacher meeting scheduled for December 20th...",
    target: "All Parents",
    channel: "SMS + Email",
    sentAt: "Dec 4, 2024 2:00 PM",
    readBy: 120,
    totalRecipients: 180,
  },
]

export default function AdminNotificationsPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [notification, setNotification] = useState({
    title: "",
    message: "",
    targetType: "all-students",
    channels: { inApp: true, email: false, sms: false },
  })
  const [sending, setSending] = useState(false)

  const { ready } = useRequireRole("ADMIN")

  const handleSend = async () => {
    setSending(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setSending(false)
    setCreateDialogOpen(false)
    alert("Notification sent successfully!")
    setNotification({
      title: "",
      message: "",
      targetType: "all-students",
      channels: { inApp: true, email: false, sms: false },
    })
  }

  if (!ready) return <FullPageLoader />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-cyan-50/20">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">🔔 Notification Management</h1>
              <p className="text-cyan-100 mt-1">Send announcements and notifications to students and teachers</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-white text-cyan-600 hover:bg-gray-100">
                  <Megaphone className="h-4 w-4 mr-2" />
                  Create Notification
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create Notification</DialogTitle>
                  <DialogDescription>Send an announcement to students, teachers, or specific groups.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      placeholder="Notification title"
                      value={notification.title}
                      onChange={(e) => setNotification({ ...notification, title: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      placeholder="Enter your message..."
                      rows={4}
                      value={notification.message}
                      onChange={(e) => setNotification({ ...notification, message: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={notification.targetType}
                      onValueChange={(v) => setNotification({ ...notification, targetType: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-students">All Students</SelectItem>
                        <SelectItem value="all-teachers">All Teachers</SelectItem>
                        <SelectItem value="all">Everyone</SelectItem>
                        <SelectItem value="class-10">Class 10 Students</SelectItem>
                        <SelectItem value="class-9">Class 9 Students</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Channels</Label>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="in-app"
                          checked={notification.channels.inApp}
                          onCheckedChange={(checked) =>
                            setNotification({
                              ...notification,
                              channels: { ...notification.channels, inApp: checked as boolean },
                            })
                          }
                        />
                        <label htmlFor="in-app" className="text-sm">
                          In-App
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="email"
                          checked={notification.channels.email}
                          onCheckedChange={(checked) =>
                            setNotification({
                              ...notification,
                              channels: { ...notification.channels, email: checked as boolean },
                            })
                          }
                        />
                        <label htmlFor="email" className="text-sm">
                          Email
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="sms"
                          checked={notification.channels.sms}
                          onCheckedChange={(checked) =>
                            setNotification({
                              ...notification,
                              channels: { ...notification.channels, sms: checked as boolean },
                            })
                          }
                        />
                        <label htmlFor="sms" className="text-sm">
                          SMS
                        </label>
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" onClick={handleSend} disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                    {sending ? "Sending..." : "Send Notification"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold">156</p>
                </div>
                <Bell className="h-8 w-8 text-violet-500" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Read Rate</p>
                  <p className="text-2xl font-bold">78%</p>
                </div>
                <FileText className="h-8 w-8 text-emerald-500" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <p className="text-2xl font-bold">424</p>
                </div>
                <Users className="h-8 w-8 text-amber-500" />
              </CardContent>
            </Card>
          </div>

          {/* Recent Notifications */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sentNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-semibold mb-1">{notif.title}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{notif.message}</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{notif.target}</Badge>
                        <Badge variant="secondary">{notif.channel}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{notif.sentAt}</p>
                      <p className="text-sm font-medium mt-1">
                        {notif.readBy}/{notif.totalRecipients} read
                      </p>
                      <div className="w-24 h-2 bg-muted rounded-full mt-1 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${(notif.readBy / notif.totalRecipients) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
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
