"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Period {
  id: string
  subject: string
  teacher: string
  room: string
  color: string
}

interface TimetableData {
  [day: string]: {
    [period: string]: Period | null
  }
}

const timeSlots = [
  { id: "1", time: "8:00 - 8:45" },
  { id: "2", time: "8:45 - 9:30" },
  { id: "3", time: "9:30 - 10:15" },
  { id: "break1", time: "10:15 - 10:30", isBreak: true },
  { id: "4", time: "10:30 - 11:15" },
  { id: "5", time: "11:15 - 12:00" },
  { id: "6", time: "12:00 - 12:45" },
  { id: "break2", time: "12:45 - 1:30", isBreak: true },
  { id: "7", time: "1:30 - 2:15" },
  { id: "8", time: "2:15 - 3:00" },
]

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const timetableData: TimetableData = {
  Monday: {
    "1": {
      id: "1",
      subject: "Mathematics",
      teacher: "Mr. Smith",
      room: "101",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    "2": {
      id: "2",
      subject: "English",
      teacher: "Mrs. Johnson",
      room: "102",
      color: "bg-accent/10 text-accent border-accent/30",
    },
    "3": {
      id: "3",
      subject: "Science",
      teacher: "Dr. Brown",
      room: "Lab 1",
      color: "bg-success/10 text-success border-success/30",
    },
    "4": {
      id: "4",
      subject: "History",
      teacher: "Mr. Davis",
      room: "103",
      color: "bg-warning/10 text-warning border-warning/30",
    },
    "5": {
      id: "5",
      subject: "Computer",
      teacher: "Ms. Wilson",
      room: "Lab 2",
      color: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    },
    "6": {
      id: "6",
      subject: "Art",
      teacher: "Mrs. Taylor",
      room: "Art Room",
      color: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    },
    "7": {
      id: "7",
      subject: "PE",
      teacher: "Mr. Anderson",
      room: "Ground",
      color: "bg-destructive/10 text-destructive border-destructive/30",
    },
    "8": null,
  },
  Tuesday: {
    "1": {
      id: "1",
      subject: "Science",
      teacher: "Dr. Brown",
      room: "Lab 1",
      color: "bg-success/10 text-success border-success/30",
    },
    "2": {
      id: "2",
      subject: "Mathematics",
      teacher: "Mr. Smith",
      room: "101",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    "3": {
      id: "3",
      subject: "English",
      teacher: "Mrs. Johnson",
      room: "102",
      color: "bg-accent/10 text-accent border-accent/30",
    },
    "4": {
      id: "4",
      subject: "Computer",
      teacher: "Ms. Wilson",
      room: "Lab 2",
      color: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    },
    "5": {
      id: "5",
      subject: "History",
      teacher: "Mr. Davis",
      room: "103",
      color: "bg-warning/10 text-warning border-warning/30",
    },
    "6": {
      id: "6",
      subject: "Music",
      teacher: "Mr. Lee",
      room: "Music Room",
      color: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    },
    "7": {
      id: "7",
      subject: "Mathematics",
      teacher: "Mr. Smith",
      room: "101",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    "8": null,
  },
  Wednesday: {
    "1": {
      id: "1",
      subject: "English",
      teacher: "Mrs. Johnson",
      room: "102",
      color: "bg-accent/10 text-accent border-accent/30",
    },
    "2": {
      id: "2",
      subject: "Science",
      teacher: "Dr. Brown",
      room: "Lab 1",
      color: "bg-success/10 text-success border-success/30",
    },
    "3": {
      id: "3",
      subject: "Mathematics",
      teacher: "Mr. Smith",
      room: "101",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    "4": {
      id: "4",
      subject: "PE",
      teacher: "Mr. Anderson",
      room: "Ground",
      color: "bg-destructive/10 text-destructive border-destructive/30",
    },
    "5": {
      id: "5",
      subject: "Computer",
      teacher: "Ms. Wilson",
      room: "Lab 2",
      color: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    },
    "6": {
      id: "6",
      subject: "History",
      teacher: "Mr. Davis",
      room: "103",
      color: "bg-warning/10 text-warning border-warning/30",
    },
    "7": {
      id: "7",
      subject: "Art",
      teacher: "Mrs. Taylor",
      room: "Art Room",
      color: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    },
    "8": {
      id: "8",
      subject: "Library",
      teacher: "Ms. Garcia",
      room: "Library",
      color: "bg-muted text-muted-foreground border-border",
    },
  },
  Thursday: {
    "1": {
      id: "1",
      subject: "History",
      teacher: "Mr. Davis",
      room: "103",
      color: "bg-warning/10 text-warning border-warning/30",
    },
    "2": {
      id: "2",
      subject: "Mathematics",
      teacher: "Mr. Smith",
      room: "101",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    "3": {
      id: "3",
      subject: "Science",
      teacher: "Dr. Brown",
      room: "Lab 1",
      color: "bg-success/10 text-success border-success/30",
    },
    "4": {
      id: "4",
      subject: "English",
      teacher: "Mrs. Johnson",
      room: "102",
      color: "bg-accent/10 text-accent border-accent/30",
    },
    "5": {
      id: "5",
      subject: "Music",
      teacher: "Mr. Lee",
      room: "Music Room",
      color: "bg-chart-3/10 text-chart-3 border-chart-3/30",
    },
    "6": {
      id: "6",
      subject: "Computer",
      teacher: "Ms. Wilson",
      room: "Lab 2",
      color: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    },
    "7": null,
    "8": null,
  },
  Friday: {
    "1": {
      id: "1",
      subject: "Computer",
      teacher: "Ms. Wilson",
      room: "Lab 2",
      color: "bg-chart-4/10 text-chart-4 border-chart-4/30",
    },
    "2": {
      id: "2",
      subject: "English",
      teacher: "Mrs. Johnson",
      room: "102",
      color: "bg-accent/10 text-accent border-accent/30",
    },
    "3": {
      id: "3",
      subject: "History",
      teacher: "Mr. Davis",
      room: "103",
      color: "bg-warning/10 text-warning border-warning/30",
    },
    "4": {
      id: "4",
      subject: "Mathematics",
      teacher: "Mr. Smith",
      room: "101",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    "5": {
      id: "5",
      subject: "Science",
      teacher: "Dr. Brown",
      room: "Lab 1",
      color: "bg-success/10 text-success border-success/30",
    },
    "6": {
      id: "6",
      subject: "PE",
      teacher: "Mr. Anderson",
      room: "Ground",
      color: "bg-destructive/10 text-destructive border-destructive/30",
    },
    "7": {
      id: "7",
      subject: "Art",
      teacher: "Mrs. Taylor",
      room: "Art Room",
      color: "bg-chart-5/10 text-chart-5 border-chart-5/30",
    },
    "8": null,
  },
  Saturday: {
    "1": {
      id: "1",
      subject: "Mathematics",
      teacher: "Mr. Smith",
      room: "101",
      color: "bg-primary/10 text-primary border-primary/30",
    },
    "2": {
      id: "2",
      subject: "Science",
      teacher: "Dr. Brown",
      room: "Lab 1",
      color: "bg-success/10 text-success border-success/30",
    },
    "3": {
      id: "3",
      subject: "English",
      teacher: "Mrs. Johnson",
      room: "102",
      color: "bg-accent/10 text-accent border-accent/30",
    },
    "4": null,
    "5": null,
    "6": null,
    "7": null,
    "8": null,
  },
}

export function WeeklyTimetable() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" })

  return (
    <Card className="border-0 shadow-sm overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Class 8-A Weekly Schedule</CardTitle>
        <p className="text-sm text-muted-foreground">Academic Year 2025-2026</p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="p-3 text-left text-xs font-semibold text-muted-foreground w-24">Time</th>
                {days.map((day) => (
                  <th
                    key={day}
                    className={cn(
                      "p-3 text-center text-xs font-semibold",
                      day === today ? "bg-primary/10 text-primary" : "text-muted-foreground",
                    )}
                  >
                    {day.slice(0, 3)}
                    {day === today && (
                      <Badge className="ml-2 bg-primary text-primary-foreground text-[10px] px-1.5 py-0">Today</Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((slot) => (
                <tr key={slot.id} className={cn("border-b transition-colors", slot.isBreak && "bg-muted/50")}>
                  <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                    {slot.time}
                    {slot.isBreak && <span className="block text-[10px] font-medium">Break</span>}
                  </td>
                  {slot.isBreak ? (
                    <td colSpan={6} className="p-3 text-center text-xs text-muted-foreground">
                      {slot.id === "break1" ? "Morning Break" : "Lunch Break"}
                    </td>
                  ) : (
                    days.map((day) => {
                      const period = timetableData[day]?.[slot.id]
                      return (
                        <td key={day} className="p-1.5">
                          {period ? (
                            <div
                              className={cn(
                                "p-2 rounded-lg border text-center transition-all hover:shadow-sm cursor-pointer",
                                period.color,
                              )}
                            >
                              <p className="font-medium text-xs">{period.subject}</p>
                              <p className="text-[10px] opacity-80">{period.teacher}</p>
                              <p className="text-[10px] opacity-60">{period.room}</p>
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-muted/30 text-center">
                              <p className="text-xs text-muted-foreground">Free</p>
                            </div>
                          )}
                        </td>
                      )
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
