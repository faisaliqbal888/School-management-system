"use client"

import { useState } from "react"
import { BellRing, Loader2, Megaphone } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  useInboxActions,
  useNotifications,
  useUnreadCount,
  type NotificationFilters,
  type NotificationRow,
} from "@/lib/hooks/use-notifications"
import { NotificationList } from "@/components/notifications/notification-list"
import { toast } from "sonner"

export default function ParentNotificationsPage() {
  const { ready } = useRequireRole("PARENT")

  const [filters, setFilters] = useState<NotificationFilters>({ page: 1, limit: 10 })
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

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <BellRing className="h-7 w-7" /> Notifications
            </h1>
            <p className="mt-1 text-rose-100">
              {unread > 0 ? `${unread} unread of ${total} notices` : "You’re all caught up"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Inbox", value: total, icon: Megaphone, tone: "bg-indigo-50 text-indigo-600" },
              { label: "Unread", value: unread, icon: BellRing, tone: "bg-amber-50 text-amber-600" },
              {
                label: "On this page",
                value: notifications.length,
                icon: Megaphone,
                tone: "bg-rose-50 text-rose-600",
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
              <CardTitle className="text-base">Your inbox</CardTitle>
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
                isPending={actions.isPending}
                emptyHint="School announcements and messages about your children appear here."
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
