"use client"

import { useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, BellRing, Megaphone } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import {
  useInboxActions,
  useNotifications,
  useUnreadCount,
  type NotificationFilters,
  type NotificationRow,
} from "@/lib/hooks/use-notifications"
import { NotificationList } from "@/components/notifications/notification-list"
import { ComposeNotificationModal } from "@/components/notifications/compose-notification-modal"
import { toast } from "sonner"

export default function TeacherNotificationsPage() {
  const { ready } = useRequireRole("TEACHER")

  const [filters, setFilters] = useState<NotificationFilters>({ page: 1, limit: 10 })
  const [composeOpen, setComposeOpen] = useState(false)

  const { notifications, meta, isLoading, refetch } = useNotifications(filters)
  const { unread, total, refetch: refetchUnread } = useUnreadCount()
  const actions = useInboxActions(() => {
    refetch()
    refetchUnread()
  })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleToggleRead = async (notice: NotificationRow) => {
    try {
      await actions.setRead(notice.id, !notice.isRead)
    } catch {
      toast.error("Could not update this notice")
    }
  }

  const handleMarkAll = async () => {
    try {
      const result = await actions.markEverythingRead()
      toast.success(result.marked === 0 ? "Nothing left unread" : `${result.marked} notices marked read`)
    } catch {
      toast.error("Could not mark notices read")
    }
  }

  const handleDelete = async (notice: NotificationRow) => {
    try {
      await actions.deleteNotice(notice.id)
      toast.success("Notice deleted", { description: notice.title })
    } catch {
      toast.error("You can only delete notices you sent")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                Your inbox · {unread} unread of {total}
              </p>
            </div>
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Message my class
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Inbox", value: total, icon: Megaphone, tone: "bg-indigo-50 text-indigo-600" },
              { label: "Unread", value: unread, icon: BellRing, tone: "bg-amber-50 text-amber-600" },
              {
                label: "On this page",
                value: notifications.length,
                icon: Megaphone,
                tone: "bg-emerald-50 text-emerald-600",
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Inbox</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationList
                notifications={notifications}
                meta={meta}
                isLoading={isLoading}
                filters={filters}
                onFiltersChange={setFilters}
                onToggleRead={handleToggleRead}
                onMarkAllRead={handleMarkAll}
                onDelete={handleDelete}
                canDelete
                isPending={actions.isPending}
                emptyHint="School announcements and your own class messages appear here."
              />
            </CardContent>
          </Card>
        </main>
      </div>

      <ComposeNotificationModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          toast.success("Notice sent to your class")
          refetch()
          refetchUnread()
        }}
      />
    </div>
  )
}
