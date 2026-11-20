"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useUnreadCount } from "@/lib/hooks/use-notifications"

export function StudentHeader() {
  const { user, isAuthenticated } = useAuth()
  const { unread } = useUnreadCount()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subjects, results, notices..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950">
          <span className="text-xs text-muted-foreground">Roll No:</span>
          <span className="text-sm font-semibold text-blue-600">{user?.rollNo || "—"}</span>
        </div>

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/student/notifications" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {isAuthenticated && unread > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-red-500 px-1 text-[10px]">
                {unread > 99 ? "99+" : unread}
              </Badge>
            )}
          </Link>
        </Button>
      </div>
    </header>
  )
}
