"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

const students = [
  {
    name: "Alex Thompson",
    class: "10-A",
    attendance: 94,
    avgGrade: "A",
    avatar: "/placeholder.svg?height=32&width=32",
  },
  {
    name: "Emma Wilson",
    class: "10-A",
    attendance: 98,
    avgGrade: "A+",
    avatar: "/emma-student.jpg",
  },
  {
    name: "James Brown",
    class: "10-B",
    attendance: 85,
    avgGrade: "B+",
    avatar: "/james-student.jpg",
  },
  {
    name: "Sophie Davis",
    class: "9-A",
    attendance: 92,
    avgGrade: "A",
    avatar: "/sophie-student.jpg",
  },
  {
    name: "Michael Lee",
    class: "9-B",
    attendance: 78,
    avgGrade: "B",
    avatar: "/michael-student.jpg",
  },
]

export function ClassRoster() {
  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">My Students</CardTitle>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {students.map((student, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={student.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{student.name}</p>
                  <p className="text-xs text-muted-foreground">Class {student.class}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <p
                    className={`text-sm font-semibold ${
                      student.attendance >= 90
                        ? "text-emerald-600"
                        : student.attendance >= 75
                          ? "text-amber-600"
                          : "text-red-600"
                    }`}
                  >
                    {student.attendance}%
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    student.avgGrade.includes("+") || student.avgGrade === "A"
                      ? "border-emerald-500 text-emerald-600"
                      : "border-blue-500 text-blue-600"
                  }
                >
                  {student.avgGrade}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
