"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Megaphone, Plus, Users, BellRing, MailCheck } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import {
  AUDIENCE_LABEL,
  audienceTone,
  timeAgo,
  useDeliveryStats,
  useInboxActions,
  useNotifications,
  useUnreadCount,
  type NotificationFilters,
  type NotificationRow,
} from "@/lib/hooks/use-notifications"
import { NotificationList } from "@/components/notifications/notification-list"
import { ComposeNotificationModal } from "@/components/notifications/compose-notification-modal"
import { toast } from "sonner"

export default function AdminNotificationsPage() {
  const { ready } = useRequireRole("ADMIN")

  const [filters, setFilters] = useState<NotificationFilters>({ page: 1, limit: 10 })
  const [composeOpen, setComposeOpen] = useState(false)

  const { notifications, meta, isLoading, refetch } = useNotifications(filters)
  const { unread, total } = useUnreadCount()
  const { stats, refetch: refetchStats } = useDeliveryStats()
  const actions = useInboxActions(() => {
    refetch()
    refetchStats()
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
      toast.success(result.marked === 0 ? "Your inbox is already up to date" : `${result.marked} notices marked read`)
    } catch {
      toast.error("Could not mark notices read")
    }
  }

  const handleDelete = async (notice: NotificationRow) => {
    try {
      await actions.deleteNotice(notice.id)
      toast.success("Notice deleted", { description: notice.title })
    } catch {
      toast.error("Could not delete this notice")
    }
  }

  const handleSent = () => {
    toast.success("Notice sent")
    refetch()
    refetchStats()
  }

  const statsCards = [
    { label: "Notices sent", value: stats?.total ?? 0, icon: Megaphone, tone: "bg-indigo-50 text-indigo-600" },
    { label: "Inbox total", value: total, icon: BellRing, tone: "bg-blue-50 text-blue-600" },
    { label: "Unread for you", value: unread, icon: MailCheck, tone: "bg-amber-50 text-amber-600" },
    { label: "Active accounts", value: stats?.activeUsers ?? 0, icon: Users, tone: "bg-emerald-50 text-emerald-600" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">Send announcements and track how many people read them</p>
            </div>
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New notice
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statsCards.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.tone}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
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
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Read rate — recent notices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(stats?.recent ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No notices yet.</p>
                ) : (
                  stats?.recent.map((notice) => (
                    <div key={notice.id} className="space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{notice.title}</p>
                        <Badge className={audienceTone[notice.audience]}>{AUDIENCE_LABEL[notice.audience]}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{notice.readCount} reads</span>
                        <span>·</span>
                        <span>{timeAgo(notice.sentAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <ComposeNotificationModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={handleSent}
      />
    </div>
  )
}
