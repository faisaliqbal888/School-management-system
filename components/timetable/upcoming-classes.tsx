"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

const upcomingClasses = [
  {
    id: "1",
    subject: "Mathematics",
    teacher: "Mr. Smith",
    teacherAvatar: "/placeholder.svg?key=teacher-math",
    time: "8:00 AM - 8:45 AM",
    room: "Room 101",
    status: "current",
  },
  {
    id: "2",
    subject: "English Literature",
    teacher: "Mrs. Johnson",
    teacherAvatar: "/placeholder.svg?key=teacher-english",
    time: "8:45 AM - 9:30 AM",
    room: "Room 102",
    status: "next",
  },
  {
    id: "3",
    subject: "Science Lab",
    teacher: "Dr. Brown",
    teacherAvatar: "/placeholder.svg?key=teacher-science",
    time: "9:30 AM - 10:15 AM",
    room: "Lab 1",
    status: "upcoming",
  },
  {
    id: "4",
    subject: "History",
    teacher: "Mr. Davis",
    teacherAvatar: "/placeholder.svg?key=teacher-history",
    time: "10:30 AM - 11:15 AM",
    room: "Room 103",
    status: "upcoming",
  },
]

export function UpcomingClasses() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg">Today&apos;s Classes</CardTitle>
          <p className="text-sm text-muted-foreground">Your schedule for today</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          Full Schedule <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingClasses.map((cls) => (
            <div
              key={cls.id}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl border transition-all",
                cls.status === "current" && "bg-primary/5 border-primary/30 shadow-sm",
                cls.status === "next" && "bg-accent/5 border-accent/30",
                cls.status === "upcoming" && "bg-card border-border hover:border-primary/30",
              )}
            >
              <Avatar className="h-11 w-11 ring-2 ring-border">
                <AvatarImage src={cls.teacherAvatar || "/placeholder.svg"} alt={cls.teacher} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {cls.teacher
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{cls.subject}</p>
                  {cls.status === "current" && (
                    <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Now</Badge>
                  )}
                  {cls.status === "next" && (
                    <Badge className="bg-accent text-accent-foreground text-[10px] px-1.5 py-0">Next</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{cls.teacher}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {cls.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {cls.room}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
