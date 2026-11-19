"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, ClipboardCheck } from "lucide-react"
import Link from "next/link"

const todayClasses = [
  {
    subject: "Mathematics",
    class: "10-A",
    time: "8:00 - 8:45 AM",
    room: "Room 301",
    students: 32,
    status: "completed",
    attendanceMarked: true,
  },
  {
    subject: "Mathematics",
    class: "10-B",
    time: "9:00 - 9:45 AM",
    room: "Room 302",
    students: 30,
    status: "completed",
    attendanceMarked: true,
  },
  {
    subject: "Physics",
    class: "9-A",
    time: "10:00 - 10:45 AM",
    room: "Lab 2",
    students: 28,
    status: "ongoing",
    attendanceMarked: false,
  },
  {
    subject: "Mathematics",
    class: "9-B",
    time: "11:00 - 11:45 AM",
    room: "Room 205",
    students: 31,
    status: "upcoming",
    attendanceMarked: false,
  },
  {
    subject: "Physics",
    class: "10-A",
    time: "12:30 - 1:15 PM",
    room: "Lab 2",
    students: 32,
    status: "upcoming",
    attendanceMarked: false,
  },
]

export function TodayClasses() {
  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Today&apos;s Classes</CardTitle>
          <Badge variant="outline">{new Date().toLocaleDateString("en-US", { weekday: "long" })}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {todayClasses.map((cls, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border transition-all ${
              cls.status === "ongoing"
                ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50 ring-2 ring-emerald-500/20"
                : cls.status === "completed"
                  ? "border-border/50 bg-muted/30 opacity-70"
                  : "border-border/50 bg-background hover:bg-muted/30"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold">{cls.subject}</h4>
                  <Badge variant="secondary">Class {cls.class}</Badge>
                  {cls.status === "ongoing" && (
                    <Badge className="bg-emerald-500 text-white text-[10px] animate-pulse">Live</Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {cls.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {cls.room}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {cls.students} students
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                {!cls.attendanceMarked && cls.status !== "upcoming" && (
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/teacher/attendance">
                      <ClipboardCheck className="h-4 w-4 mr-1" />
                      Mark
                    </Link>
                  </Button>
                )}
                {cls.attendanceMarked && (
                  <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                    Marked
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
