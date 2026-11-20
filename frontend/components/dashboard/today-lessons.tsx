"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarX2, Clock, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { prettyTime, type TodaySchedule } from "@/lib/hooks/use-dashboard"

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
}

interface Props {
  today: TodaySchedule | undefined
  title?: string
  showTeacher?: boolean
  className?: string
}

export function TodayLessons({ today, title, showTeacher = false, className }: Props) {
  const lessons = today?.lessons ?? []

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">{title ?? "Today's timetable"}</CardTitle>
        {today && <Badge variant="secondary">{DAY_LABEL[today.day] ?? today.day}</Badge>}
      </CardHeader>

      <CardContent>
        {lessons.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <CalendarX2 className="h-7 w-7 text-muted-foreground/50" />
            No lessons scheduled today.
          </div>
        ) : (
          <ul className="space-y-2">
            {lessons.map((lesson) => (
              <li
                key={lesson.id}
                className={cn(
                  "flex items-start gap-3 rounded-md border p-2.5",
                  lesson.isCurrent && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                  {prettyTime(lesson.startTime)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{lesson.subject}</span>
                    {lesson.isCurrent && <Badge className="h-5 px-1.5 text-[10px]">Now</Badge>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="truncate">{lesson.className}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {prettyTime(lesson.startTime)} – {prettyTime(lesson.endTime)}
                    </span>
                    {lesson.roomNo && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lesson.roomNo}
                      </span>
                    )}
                    {showTeacher && lesson.teacher && <span className="truncate">{lesson.teacher}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
