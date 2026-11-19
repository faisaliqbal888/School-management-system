"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin, ArrowRight } from "lucide-react"

const events = [
  {
    id: 1,
    title: "Parent-Teacher Meeting",
    date: "Dec 15, 2025",
    time: "10:00 AM",
    location: "Main Hall",
    color: "bg-primary",
  },
  {
    id: 2,
    title: "Annual Sports Day",
    date: "Dec 20, 2025",
    time: "9:00 AM",
    location: "Sports Ground",
    color: "bg-accent",
  },
  {
    id: 3,
    title: "Science Exhibition",
    date: "Dec 22, 2025",
    time: "11:00 AM",
    location: "Science Lab",
    color: "bg-warning",
  },
  {
    id: 4,
    title: "Winter Break Begins",
    date: "Dec 25, 2025",
    time: "All Day",
    location: "School Wide",
    color: "bg-success",
  },
]

export function UpcomingEvents() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Upcoming Events</CardTitle>
          <p className="text-sm text-muted-foreground">School calendar highlights</p>
        </div>
        <Button variant="ghost" size="sm" className="text-primary">
          View all <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
              <div className={`w-1 rounded-full ${event.color}`} />
              <div className="flex-1 space-y-1">
                <p className="font-medium text-sm">{event.title}</p>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {event.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {event.location}
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
