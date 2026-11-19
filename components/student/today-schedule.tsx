"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, User } from "lucide-react"

const todayClasses = [
  {
    subject: "Mathematics",
    time: "8:00 - 8:45 AM",
    teacher: "Mr. Johnson",
    room: "Room 301",
    status: "completed",
  },
  {
    subject: "Physics",
    time: "9:00 - 9:45 AM",
    teacher: "Mrs. Smith",
    room: "Lab 2",
    status: "completed",
  },
  {
    subject: "English",
    time: "10:00 - 10:45 AM",
    teacher: "Ms. Davis",
    room: "Room 205",
    status: "ongoing",
  },
  {
    subject: "Chemistry",
    time: "11:00 - 11:45 AM",
    teacher: "Dr. Wilson",
    room: "Lab 1",
    status: "upcoming",
  },
  {
    subject: "Computer Science",
    time: "12:30 - 1:15 PM",
    teacher: "Mr. Brown",
    room: "Computer Lab",
    status: "upcoming",
  },
]

export function TodaySchedule() {
  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Today&apos;s Schedule</CardTitle>
          <Badge variant="outline">{new Date().toLocaleDateString("en-US", { weekday: "long" })}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {todayClasses.map((cls, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border transition-all ${
              cls.status === "ongoing"
                ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50 ring-2 ring-blue-500/20"
                : cls.status === "completed"
                  ? "border-border/50 bg-muted/30 opacity-60"
                  : "border-border/50 bg-background"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{cls.subject}</h4>
                  {cls.status === "ongoing" && (
                    <Badge className="bg-blue-500 text-white text-[10px] animate-pulse">Live</Badge>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {cls.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {cls.teacher}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {cls.room}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
