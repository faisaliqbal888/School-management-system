"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Bell,
  BellRing,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Megaphone,
  Search,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  AUDIENCE_LABEL,
  audienceTone,
  timeAgo,
  type NotificationFilters,
  type NotificationRow,
} from "@/lib/hooks/use-notifications"
import type { PaginationMeta } from "@/lib/hooks/use-api-query"

interface Props {
  notifications: NotificationRow[]
  meta: PaginationMeta | null
  isLoading: boolean
  filters: NotificationFilters
  onFiltersChange: (next: NotificationFilters) => void
  onToggleRead: (notice: NotificationRow) => void
  onMarkAllRead: () => void
  onDelete?: (notice: NotificationRow) => void
  canDelete?: boolean
  isPending?: boolean
  emptyHint?: string
}

export function NotificationList({
  notifications,
  meta,
  isLoading,
  filters,
  onFiltersChange,
  onToggleRead,
  onMarkAllRead,
  onDelete,
  canDelete,
  isPending,
  emptyHint,
}: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState(filters.search ?? "")

  const page = filters.page ?? 1
  const totalPages = meta?.totalPages ?? 1
  const unreadOnPage = notifications.filter((n) => !n.isRead).length

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault()
    onFiltersChange({ ...filters, page: 1, search: search.trim() || undefined })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <form onSubmit={submitSearch} className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search notices…"
            className="pl-8"
            aria-label="Search notifications"
          />
        </form>

        <div className="flex rounded-md border p-0.5">
          {[
            { label: "Inbox", value: false },
            { label: "Unread", value: true },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => onFiltersChange({ ...filters, page: 1, unreadOnly: tab.value })}
              className={cn(
                "rounded px-2.5 py-1 text-sm transition",
                Boolean(filters.unreadOnly) === tab.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={onMarkAllRead} disabled={isPending}>
          <CheckCheck className="mr-1.5 h-4 w-4" /> Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <Bell className="h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium">Nothing here</p>
            <p className="text-sm text-muted-foreground">
              {emptyHint ?? (filters.unreadOnly ? "You have read every notice." : "No notices have been sent yet.")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notice) => {
            const isOpen = expanded === notice.id
            return (
              <li key={notice.id}>
                <Card
                  className={cn(
                    "transition-colors",
                    !notice.isRead && "border-primary/30 bg-primary/[0.03]",
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                          notice.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
                        )}
                      >
                        {notice.isRead ? <Bell className="h-4 w-4" /> : <BellRing className="h-4 w-4" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            className="text-left font-medium hover:underline"
                            onClick={() => setExpanded(isOpen ? null : notice.id)}
                          >
                            {notice.title}
                          </button>
                          {!notice.isRead && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Unread" />}
                          <Badge className={cn("h-5 px-1.5 text-[10px]", audienceTone[notice.audience])}>
                            {notice.audience === "CLASS" && notice.className
                              ? notice.className
                              : AUDIENCE_LABEL[notice.audience]}
                          </Badge>
                        </div>

                        <p className={cn("mt-1 text-sm text-muted-foreground", !isOpen && "line-clamp-2")}>
                          {notice.body}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Megaphone className="h-3 w-3" />
                            {notice.authorName ?? "School Administration"}
                          </span>
                          <span>{timeAgo(notice.sentAt ?? notice.createdAt)}</span>
                          {notice.isRead && notice.readAt && <span>Read {timeAgo(notice.readAt)}</span>}
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onToggleRead(notice)}
                          disabled={isPending}
                        >
                          {notice.isRead ? "Mark unread" : "Mark read"}
                        </Button>
                        {canDelete && onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => onDelete(notice)}
                            aria-label={`Delete ${notice.title}`}
                            disabled={isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {meta ? `${meta.total} notice${meta.total === 1 ? "" : "s"}` : "\u00A0"}
          {unreadOnPage > 0 && ` · ${unreadOnPage} unread on this page`}
        </span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page <= 1}
              onClick={() => onFiltersChange({ ...filters, page: page - 1 })}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={page >= totalPages}
              onClick={() => onFiltersChange({ ...filters, page: page + 1 })}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {isPending && (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Saving…
        </p>
      )}
    </div>
  )
}
