"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface CalendarEvent {
  date: number
  title: string
  type: "holiday" | "exam" | "event" | "meeting"
}

const events: CalendarEvent[] = [
  { date: 15, title: "Mid-Term Exam Starts", type: "exam" },
  { date: 20, title: "Mid-Term Exam Ends", type: "exam" },
  { date: 22, title: "Science Exhibition", type: "event" },
  { date: 25, title: "Winter Break Begins", type: "holiday" },
  { date: 31, title: "New Year Holiday", type: "holiday" },
]

export function SchoolCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1))

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: { date: number | null; events: CalendarEvent[] }[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push({ date: null, events: [] })
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dayEvents = events.filter((e) => e.date === i)
      days.push({ date: i, events: dayEvents })
    }

    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const days = getDaysInMonth(currentDate)
  const today = new Date().getDate()
  const isCurrentMonth =
    currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()

  const getEventColor = (type: string) => {
    switch (type) {
      case "holiday":
        return "bg-destructive/10 text-destructive border-destructive/30"
      case "exam":
        return "bg-warning/10 text-warning border-warning/30"
      case "event":
        return "bg-success/10 text-success border-success/30"
      case "meeting":
        return "bg-primary/10 text-primary border-primary/30"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">School Calendar</CardTitle>
            <p className="text-sm text-muted-foreground">Events and important dates</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="sm" className="gap-1 ml-2">
              <Plus className="h-4 w-4" />
              Add Event
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-medium py-2",
                day === "Sun" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => (
            <div
              key={index}
              className={cn(
                "min-h-[80px] p-1 rounded-lg border transition-colors",
                day.date === null && "bg-transparent border-transparent",
                day.date !== null && "hover:border-primary/30 cursor-pointer",
                isCurrentMonth && day.date === today && "bg-primary/5 border-primary/30",
                index % 7 === 0 && day.date !== null && "bg-destructive/5",
              )}
            >
              {day.date && (
                <>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      index % 7 === 0 && "text-destructive",
                      isCurrentMonth && day.date === today && "text-primary",
                    )}
                  >
                    {day.date}
                  </span>
                  <div className="space-y-1 mt-1">
                    {day.events.map((event, eventIdx) => (
                      <div
                        key={eventIdx}
                        className={cn("text-[10px] px-1.5 py-0.5 rounded truncate border", getEventColor(event.type))}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/40" />
            <span className="text-xs text-muted-foreground">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning/40" />
            <span className="text-xs text-muted-foreground">Exam</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success/40" />
            <span className="text-xs text-muted-foreground">Event</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/40" />
            <span className="text-xs text-muted-foreground">Meeting</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
