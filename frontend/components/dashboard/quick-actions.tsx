"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UserPlus, ClipboardCheck, CreditCard, FileText, Send, CalendarPlus } from "lucide-react"

const actions = [
  {
    title: "Add Student",
    icon: UserPlus,
    color: "bg-primary hover:bg-primary/90",
    href: "/admin/students",
  },
  {
    title: "Mark Attendance",
    icon: ClipboardCheck,
    color: "bg-accent hover:bg-accent/90",
    href: "/admin/attendance",
  },
  {
    title: "Create Invoice",
    icon: CreditCard,
    color: "bg-success hover:bg-success/90",
    href: "/admin/fees",
  },
  {
    title: "Upload Results",
    icon: FileText,
    color: "bg-warning hover:bg-warning/90 text-warning-foreground",
    href: "/admin/exams",
  },
  {
    title: "Send Notice",
    icon: Send,
    color: "bg-chart-4 hover:bg-chart-4/90",
    href: "/admin/notifications",
  },
  {
    title: "Schedule Event",
    icon: CalendarPlus,
    color: "bg-chart-5 hover:bg-chart-5/90",
    href: "/admin/timetable",
  },
]

export function QuickActions() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground">Frequently used operations</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className={`h-auto flex-col gap-2 py-4 ${action.color} text-primary-foreground rounded-md flex items-center justify-center`}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{action.title}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
