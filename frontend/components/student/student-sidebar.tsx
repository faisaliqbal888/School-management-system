"use client"

import { SCHOOL } from "@/lib/school"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  LayoutDashboard,
  ClipboardCheck,
  FileText,
  CreditCard,
  Bell,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  LogOut,
  School,
  BookOpen,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "My Attendance", href: "/student/attendance", icon: ClipboardCheck },
  { name: "Results & Grades", href: "/student/results", icon: FileText },
  { name: "Fee & Payments", href: "/student/fees", icon: CreditCard },
  { name: "Timetable", href: "/student/timetable", icon: Calendar },
  { name: "Subjects", href: "/student/subjects", icon: BookOpen },
]

const bottomNavigation = [
  { name: "Notifications", href: "/student/notifications", icon: Bell },
  { name: "My Profile", href: "/student/profile", icon: User },
]

export function StudentSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { user, logout } = useAuth()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-gradient-to-b from-blue-600 to-cyan-600 text-white transition-all duration-300",
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
              <span className="text-xs text-white/70">Student Portal</span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className={cn("mb-2 px-3", collapsed && "px-0 text-center")}>
            <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
              {collapsed ? "•" : "Menu"}
            </span>
          </div>
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Tooltip key={item.name}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive ? "bg-white text-blue-600 shadow-lg" : "text-white/80 hover:bg-white/20",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-blue-900 text-white border-blue-800">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-white/20 px-3 py-4">
          <div className="space-y-1">
            {bottomNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive ? "bg-white/20" : "text-white/70 hover:bg-white/10",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-blue-900 text-white border-blue-800">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* User Profile */}
        <div className="border-t border-white/20 p-3">
          <div className={cn("flex items-center gap-3 rounded-xl bg-white/10 p-2", collapsed && "justify-center")}>
            <Avatar className="h-9 w-9 ring-2 ring-white/30">
              <AvatarImage src={user?.avatarUrl || "/placeholder.svg"} />
              <AvatarFallback className="bg-white text-blue-600 text-sm">{user?.name?.charAt(0) || "S"}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "Student"}</p>
                <p className="text-xs text-white/60 truncate">
                  Class {user?.class || "—"}-{user?.section || "—"}
                </p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void logout()}
                className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-white/30 bg-blue-600 text-white shadow-md hover:bg-blue-700"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>
    </TooltipProvider>
  )
}
