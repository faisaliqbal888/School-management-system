"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ClipboardCheck, FileText, AlertCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

const pendingTasks = [
  {
    type: "attendance",
    title: "Mark Attendance - Physics 9-A",
    description: "Today's class attendance pending",
    dueDate: "Today",
    priority: "high",
    href: "/teacher/attendance",
  },
  {
    type: "attendance",
    title: "Mark Attendance - Mathematics 9-B",
    description: "Today's class attendance pending",
    dueDate: "Today",
    priority: "high",
    href: "/teacher/attendance",
  },
  {
    type: "results",
    title: "Submit Mid-Term Results - Class 10-A",
    description: "Mathematics marks pending submission",
    dueDate: "Dec 10, 2024",
    priority: "medium",
    href: "/teacher/results",
  },
  {
    type: "results",
    title: "Submit Unit Test 3 Results - Class 9",
    description: "Physics marks pending submission",
    dueDate: "Dec 12, 2024",
    priority: "low",
    href: "/teacher/results",
  },
]

const iconMap = {
  attendance: ClipboardCheck,
  results: FileText,
}

const priorityColors = {
  high: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  low: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
}

export function PendingTasks() {
  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-semibold">Pending Tasks</CardTitle>
          <Badge variant="destructive">{pendingTasks.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {pendingTasks.map((task, idx) => {
          const Icon = iconMap[task.type as keyof typeof iconMap]
          return (
            <div
              key={idx}
              className="p-3 rounded-xl border border-border/50 bg-background hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${task.type === "attendance" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950" : "bg-violet-100 text-violet-600 dark:bg-violet-950"}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-medium text-sm">{task.title}</h4>
                    <Badge className={`text-[10px] ${priorityColors[task.priority as keyof typeof priorityColors]}`}>
                      {task.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Due: {task.dueDate}
                    </span>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
                      <Link href={task.href}>
                        Complete <ArrowRight className="h-3 w-3 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
