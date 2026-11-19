"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

interface DayData {
  date: number
  status: "high" | "medium" | "low" | "holiday" | null
  attendance?: number
}

export function AttendanceCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 11, 1)) // December 2025

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const days: (DayData | null)[] = []

    // Add empty cells for days before the first day
    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    // Add days of the month with mock attendance data
    for (let i = 1; i <= daysInMonth; i++) {
      const dayOfWeek = new Date(year, month, i).getDay()
      if (dayOfWeek === 0) {
        days.push({ date: i, status: "holiday" })
      } else if (i <= 5) {
        const attendance = Math.floor(Math.random() * 15) + 85
        days.push({
          date: i,
          status: attendance >= 95 ? "high" : attendance >= 85 ? "medium" : "low",
          attendance,
        })
      } else {
        days.push({ date: i, status: null })
      }
    }

    return days
  }

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1))
  }

  const days = getDaysInMonth(currentDate)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Attendance Calendar</CardTitle>
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
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
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
                "aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors",
                day === null && "bg-transparent",
                day?.status === "high" && "bg-success/20 text-success hover:bg-success/30 cursor-pointer",
                day?.status === "medium" && "bg-primary/20 text-primary hover:bg-primary/30 cursor-pointer",
                day?.status === "low" && "bg-destructive/20 text-destructive hover:bg-destructive/30 cursor-pointer",
                day?.status === "holiday" && "bg-muted text-muted-foreground",
                day?.status === null && day !== null && "bg-card border hover:bg-muted/50 cursor-pointer",
              )}
            >
              {day?.date && (
                <>
                  <span className="font-medium">{day.date}</span>
                  {day.attendance && <span className="text-[10px]">{day.attendance}%</span>}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success/40" />
            <span className="text-xs text-muted-foreground">95%+ Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary/40" />
            <span className="text-xs text-muted-foreground">85-94% Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-destructive/40" />
            <span className="text-xs text-muted-foreground">Below 85%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted" />
            <span className="text-xs text-muted-foreground">Holiday</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
