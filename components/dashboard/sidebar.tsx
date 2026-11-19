"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardCheck,
  CreditCard,
  FileText,
  Calendar,
  BookOpen,
  Bus,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  School,
  Building2,
  Package,
  BarChart3,
  Briefcase,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Students", href: "/students", icon: GraduationCap },
  { name: "Teachers & Staff", href: "/teachers", icon: Users },
  { name: "Attendance", href: "/attendance", icon: ClipboardCheck },
  { name: "Fees & Payments", href: "/fees", icon: CreditCard },
  { name: "Exams & Results", href: "/exams", icon: FileText },
  { name: "Timetable", href: "/timetable", icon: Calendar },
  { name: "Library", href: "/library", icon: BookOpen },
  { name: "Transport", href: "/transport", icon: Bus },
  { name: "Hostel", href: "/hostel", icon: Building2 },
  { name: "Inventory", href: "/inventory", icon: Package },
  { name: "HR & Payroll", href: "/hr", icon: Briefcase },
  { name: "Reports", href: "/reports", icon: BarChart3 },
]

const bottomNavigation = [
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <School className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">EduFlow</span>
              <span className="text-xs text-sidebar-foreground/60">School Management</span>
            </div>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <div className={cn("mb-2 px-3", collapsed && "px-0 text-center")}>
            <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
              {collapsed ? "•" : "Main Menu"}
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
                      isActive
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/25"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "animate-pulse")} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="bg-sidebar text-sidebar-foreground border-sidebar-border">
                    {item.name}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="border-t border-sidebar-border px-3 py-4">
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
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        collapsed && "justify-center px-2",
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" className="bg-sidebar text-sidebar-foreground border-sidebar-border">
                      {item.name}
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* User Profile */}
        <div className="border-t border-sidebar-border p-3">
          <div
            className={cn("flex items-center gap-3 rounded-xl bg-sidebar-accent/50 p-2", collapsed && "justify-center")}
          >
            <Avatar className="h-9 w-9 ring-2 ring-sidebar-primary/30">
              <AvatarImage src="/admin-portrait.png" />
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm">AD</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Admin User</p>
                <p className="text-xs text-sidebar-foreground/60 truncate">admin@eduflow.com</p>
              </div>
            )}
            {!collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
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
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar text-sidebar-foreground shadow-md hover:bg-sidebar-accent"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      </aside>
    </TooltipProvider>
  )
}
