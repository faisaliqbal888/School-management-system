"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowRight } from "lucide-react"

const students = [
  {
    id: 1,
    name: "Ali Khan",
    class: "8-A",
    admissionNo: "STU-2024-001",
    status: "Active",
    avatar: "/student-boy-portrait.jpg",
  },
  {
    id: 2,
    name: "Sara Ahmed",
    class: "9-B",
    admissionNo: "STU-2024-002",
    status: "Active",
    avatar: "/student-girl-portrait.jpg",
  },
  {
    id: 3,
    name: "Omar Hassan",
    class: "7-C",
    admissionNo: "STU-2024-003",
    status: "Pending",
    avatar: "/student-boy-portrait-young.jpg",
  },
  {
    id: 4,
    name: "Fatima Ali",
    class: "10-A",
    admissionNo: "STU-2024-004",
    status: "Active",
    avatar: "/student-girl-portrait-teen.jpg",
  },
  {
    id: 5,
    name: "Yusuf Ibrahim",
    class: "6-B",
    admissionNo: "STU-2024-005",
    status: "Active",
    avatar: "/student-boy-portrait-child.jpg",
  },
]

export function RecentStudents() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Recent Enrollments</CardTitle>
          <p className="text-sm text-muted-foreground">Latest student registrations</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          View all <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-border">
                  <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{student.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {student.admissionNo} • Class {student.class}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={student.status === "Active" ? "default" : "secondary"}
                  className={
                    student.status === "Active"
                      ? "bg-success/10 text-success hover:bg-success/20 border-0"
                      : "bg-warning/10 text-warning hover:bg-warning/20 border-0"
                  }
                >
                  {student.status}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
