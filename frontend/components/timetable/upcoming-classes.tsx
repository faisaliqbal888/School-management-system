"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, DoorOpen, Loader2, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { dayLabel, prettyTime, useTodayClasses } from "@/lib/hooks/use-timetable"

interface Props {
  /** Teachers already know their own schedule — hide the teacher column there. */
  showTeacher?: boolean
  showRoom?: boolean
  title?: string
  className?: string
}

export function UpcomingClasses({ showTeacher = true, showRoom = true, title, className }: Props) {
  const { today, isLoading } = useTodayClasses()

  const classes = today?.classes ?? []
  const nowIndex = classes.findIndex((c) => c.isCurrent)
  const nextIndex = nowIndex >= 0 ? nowIndex + 1 : 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{title ?? "Today's Classes"}</span>
          {today && <Badge variant="secondary">{dayLabel(today.day)}</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading schedule…
          </div>
        ) : classes.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No classes scheduled for today.</p>
        ) : (
          <ul className="space-y-2">
            {classes.map((slot, index) => {
              const isNow = slot.isCurrent || index === nowIndex
              const isNext = !isNow && index === nextIndex
              return (
                <li
                  key={slot.id}
                  className={cn(
                    "flex items-start gap-3 rounded-md border p-2.5 text-sm",
                    isNow && "border-primary/40 bg-primary/5",
                  )}
                >
                  <div className="w-16 shrink-0 text-xs font-medium text-muted-foreground">
                    {prettyTime(slot.startTime)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{slot.subjectName}</span>
                      {isNow && <Badge className="h-5 px-1.5 text-[10px]">Now</Badge>}
                      {isNext && (
                        <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                          Next
                        </Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {prettyTime(slot.startTime)} – {prettyTime(slot.endTime)}
                      </span>
                      {showTeacher && slot.teacherName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {slot.teacherName}
                        </span>
                      )}
                      {showRoom && slot.roomNo && (
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {slot.roomNo}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
