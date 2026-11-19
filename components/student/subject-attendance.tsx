"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const subjectAttendance = [
  { subject: "Mathematics", present: 45, total: 48, percentage: 94, color: "bg-blue-500" },
  { subject: "Physics", present: 42, total: 48, percentage: 88, color: "bg-emerald-500" },
  { subject: "Chemistry", present: 44, total: 48, percentage: 92, color: "bg-violet-500" },
  { subject: "English", present: 46, total: 48, percentage: 96, color: "bg-amber-500" },
  { subject: "Computer Science", present: 43, total: 48, percentage: 90, color: "bg-cyan-500" },
  { subject: "Biology", present: 41, total: 48, percentage: 85, color: "bg-rose-500" },
]

export function SubjectAttendance() {
  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Subject-wise Attendance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {subjectAttendance.map((item) => (
          <div key={item.subject} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.subject}</span>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">
                  {item.present}/{item.total}
                </span>
                <span
                  className={`font-semibold ${
                    item.percentage >= 90
                      ? "text-emerald-600"
                      : item.percentage >= 75
                        ? "text-amber-600"
                        : "text-red-600"
                  }`}
                >
                  {item.percentage}%
                </span>
              </div>
            </div>
            <div className="relative">
              <Progress value={item.percentage} className="h-2.5 bg-muted" />
              <div
                className={`absolute left-0 top-0 h-full rounded-full transition-all ${item.color}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
