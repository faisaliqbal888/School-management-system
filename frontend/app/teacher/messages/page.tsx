"use client"

import { useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Megaphone, Plus, Send, Users } from "lucide-react"
import { useRequireRole, useAuth } from "@/lib/auth-context"
import { AUDIENCE_LABEL, useNotifications, type NotificationRow } from "@/lib/hooks/use-notifications"
import { ComposeNotificationModal } from "@/components/notifications/compose-notification-modal"
import { cn } from "@/lib/utils"

/**
 * Messaging for teachers.
 *
 * The backend broadcasts notices to an audience rather than running
 * one-to-one chats, so this page is a two-pane view over exactly that: the
 * announcements this teacher can see on the left, the full text on the right,
 * and a composer that publishes to a class or the whole school.
 */
export default function TeacherMessagesPage() {
  const { ready } = useRequireRole("TEACHER")
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)

  const { notifications, meta, isLoading, refetch } = useNotifications({ page, limit: 20 })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    )
  }

  const selected: NotificationRow | undefined =
    notifications.find((row) => row.id === selectedId) ?? notifications[0]

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground">
                Announcements to your classes and the whole school — parents and colleagues see them
                in their own inboxes.
              </p>
            </div>
            <Button onClick={() => setComposeOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> New announcement
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
            <Card className="overflow-hidden">
              <CardHeader className="border-b pb-3">
                <CardTitle className="flex items-center justify-between text-base">
                  <span className="flex items-center gap-2">
                    <Megaphone className="h-4 w-4" /> Sent &amp; inbox
                  </span>
                  {meta && <span className="text-xs font-normal text-muted-foreground">{meta.total}</span>}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[calc(100vh-18rem)] overflow-y-auto p-2">
                {isLoading ? (
                  <div className="space-y-2 p-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : notifications.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    No announcements yet — start the conversation.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((row) => {
                      const active = selected?.id === row.id
                      return (
                        <button
                          key={row.id}
                          onClick={() => setSelectedId(row.id)}
                          className={cn(
                            "w-full rounded-lg px-3 py-2 text-left transition-colors",
                            active ? "bg-primary/10" : "hover:bg-muted/60",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("truncate text-sm", row.isRead ? "font-medium" : "font-semibold")}>
                              {row.title}
                            </p>
                            {!row.isRead && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{row.body}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px]">
                              {AUDIENCE_LABEL[row.audience] ?? row.audience}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(row.createdAt).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {meta && meta.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t px-2 py-2 text-xs">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((value) => Math.max(1, value - 1))}
                    >
                      Previous
                    </Button>
                    <span className="text-muted-foreground">
                      {meta.page} / {meta.totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((value) => value + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="min-h-[24rem]">
              <CardHeader className="border-b pb-3">
                <CardTitle className="truncate text-base">{selected?.title ?? "No message selected"}</CardTitle>
                {selected && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <Badge variant="secondary">{AUDIENCE_LABEL[selected.audience] ?? selected.audience}</Badge>
                    <span>
                      {new Date(selected.createdAt).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {selected.authorName && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {selected.authorName}
                      </span>
                    )}
                    {selected.authorName === user?.name && (
                      <span className="flex items-center gap-1 text-primary">
                        <Send className="h-3 w-3" /> sent by you
                      </span>
                    )}
                    {selected.className && <span>· {selected.className}</span>}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {selected ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{selected.body}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Pick an announcement on the left, or publish a new one with the composer.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

        </main>
      </div>

      <ComposeNotificationModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSent={() => {
          setComposeOpen(false)
          setPage(1)
          refetch()
        }}
      />
    </div>
  )
}
