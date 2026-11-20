"use client"

import { SCHOOL } from "@/lib/school"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  CreditCard,
  Bell,
  LogOut,
  School,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"

const navigation = [
  { name: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
  { name: "My Children", href: "/parent/children", icon: Users },
  { name: "Attendance", href: "/parent/attendance", icon: ClipboardCheck },
  { name: "Results", href: "/parent/results", icon: FileText },
  { name: "Timetable", href: "/parent/timetable", icon: Calendar },
  { name: "Fees", href: "/parent/fees", icon: CreditCard },
]

const bottomNavigation = [{ name: "Notifications", href: "/parent/notifications", icon: Bell }]

export function ParentSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-gradient-to-b from-rose-600 to-pink-700 text-white transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64",
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/20 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
          <School className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight">{SCHOOL.shortName}</span>
            <span className="text-xs text-white/70">Parent Portal</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2",
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="space-y-1 border-t border-white/20 p-3">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-white/20 text-white" : "text-white/80 hover:bg-white/10 hover:text-white",
                collapsed && "justify-center px-2",
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}

        {/* User */}
        <div className={cn("mt-2 flex items-center gap-3 rounded-lg bg-white/10 p-2.5", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 ring-2 ring-white/30">
            <AvatarImage src={user?.avatarUrl || "/parent-woman.jpg"} />
            <AvatarFallback className="bg-white text-rose-600 text-sm">
              {user?.name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user?.name || "Parent"}</p>
              <p className="truncate text-xs text-white/60">
                {user?.children?.length ?? 0} child(ren)
              </p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
          className={cn(
            "w-full justify-start gap-3 text-white/80 hover:bg-white/10 hover:text-white",
            collapsed && "justify-center",
          )}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && "Sign Out"}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn("w-full gap-3 text-white/80 hover:bg-white/10 hover:text-white", collapsed && "justify-center")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && "Collapse"}
        </Button>
      </div>
    </aside>
  )
}
