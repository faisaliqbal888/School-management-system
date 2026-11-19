"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"

export function ParentHeader() {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur-sm">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search children, fees, results…" className="border-0 bg-muted/50 pl-10" />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 sm:flex">
          <span className="text-xs text-muted-foreground">Role:</span>
          <span className="text-sm font-semibold text-rose-600">Parent</span>
        </div>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center bg-red-500 p-0 text-[10px]">
            3
          </Badge>
        </Button>

        <Avatar className="h-9 w-9">
          <AvatarImage src={user?.avatarUrl || "/parent-woman.jpg"} />
          <AvatarFallback className="bg-rose-100 text-rose-600">
            {user?.name?.charAt(0) || "P"}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
