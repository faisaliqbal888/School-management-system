"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { MobileNavTrigger } from "@/components/layout/mobile-nav"
import { useUnreadCount } from "@/lib/hooks/use-notifications"

export function AdminHeader() {
  const { user, isAuthenticated } = useAuth()
  const { unread } = useUnreadCount()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-6">
      <div className="flex flex-1 items-center gap-2">
        <MobileNavTrigger />
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students, teachers, invoices..."
            className="pl-10 bg-muted/50 border-0 focus-visible:ring-1"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950">
          <span className="text-xs text-muted-foreground">Role:</span>
          <span className="text-sm font-semibold text-violet-600">Administrator</span>
        </div>

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link href="/admin/notifications" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            {isAuthenticated && unread > 0 && (
              <Badge className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] bg-red-500">
                {unread > 99 ? "99+" : unread}
              </Badge>
            )}
          </Link>
        </Button>
      </div>
    </header>
  )
}
