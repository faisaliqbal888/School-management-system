"use client"

import { useState } from "react"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, MapPin, Users, BookOpen, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"]

const teacherSchedule = {
  Monday: [
    { time: "8:00 AM", class: "10-A", subject: "Mathematics", room: "Room 101", students: 45 },
    { time: "9:00 AM", class: "10-A", subject: "Mathematics", room: "Room 101", students: 45 },
    { time: "10:00 AM", class: "10-B", subject: "Mathematics", room: "Room 102", students: 42 },
    { time: "11:00 AM", class: "9-A", subject: "Mathematics", room: "Room 103", students: 40 },
    { time: "12:00 PM", subject: "Lunch Break", type: "break" },
    { time: "1:00 PM", class: "11-A", subject: "Mathematics", room: "Room 104", students: 38 },
    { time: "2:00 PM", subject: "Free Period", type: "free" },
    { time: "3:00 PM", class: "12-A", subject: "Mathematics", room: "Room 105", students: 35 },
  ],
  Tuesday: [
    { time: "8:00 AM", class: "9-B", subject: "Mathematics", room: "Room 101", students: 43 },
    { time: "9:00 AM", class: "10-A", subject: "Mathematics", room: "Room 101", students: 45 },
    { time: "10:00 AM", subject: "Staff Meeting", type: "meeting" },
    { time: "11:00 AM", class: "10-B", subject: "Mathematics", room: "Room 102", students: 42 },
    { time: "12:00 PM", subject: "Lunch Break", type: "break" },
    { time: "1:00 PM", class: "12-B", subject: "Mathematics", room: "Room 104", students: 36 },
    { time: "2:00 PM", class: "11-B", subject: "Mathematics", room: "Room 105", students: 39 },
    { time: "3:00 PM", subject: "Free Period", type: "free" },
  ],
  Wednesday: [
    { time: "8:00 AM", class: "10-A", subject: "Mathematics", room: "Room 101", students: 45 },
    { time: "9:00 AM", class: "9-A", subject: "Mathematics", room: "Room 103", students: 40 },
    { time: "10:00 AM", class: "9-B", subject: "Mathematics", room: "Room 101", students: 43 },
    { time: "11:00 AM", class: "10-B", subject: "Mathematics", room: "Room 102", students: 42 },
    { time: "12:00 PM", subject: "Lunch Break", type: "break" },
    { time: "1:00 PM", subject: "Free Period", type: "free" },
    { time: "2:00 PM", class: "11-A", subject: "Mathematics", room: "Room 104", students: 38 },
    { time: "3:00 PM", class: "12-A", subject: "Mathematics", room: "Room 105", students: 35 },
  ],
  Thursday: [
    { time: "8:00 AM", class: "11-B", subject: "Mathematics", room: "Room 105", students: 39 },
    { time: "9:00 AM", class: "12-B", subject: "Mathematics", room: "Room 104", students: 36 },
    { time: "10:00 AM", class: "10-A", subject: "Mathematics", room: "Room 101", students: 45 },
    { time: "11:00 AM", subject: "Free Period", type: "free" },
    { time: "12:00 PM", subject: "Lunch Break", type: "break" },
    { time: "1:00 PM", class: "9-A", subject: "Mathematics", room: "Room 103", students: 40 },
    { time: "2:00 PM", class: "10-B", subject: "Mathematics", room: "Room 102", students: 42 },
    { time: "3:00 PM", subject: "Parent Meeting", type: "meeting" },
  ],
  Friday: [
    { time: "8:00 AM", class: "10-A", subject: "Mathematics", room: "Room 101", students: 45 },
    { time: "9:00 AM", class: "10-B", subject: "Mathematics", room: "Room 102", students: 42 },
    { time: "10:00 AM", class: "11-A", subject: "Mathematics", room: "Room 104", students: 38 },
    { time: "11:00 AM", class: "12-A", subject: "Mathematics", room: "Room 105", students: 35 },
    { time: "12:00 PM", subject: "Lunch Break", type: "break" },
    { time: "1:00 PM", class: "9-B", subject: "Mathematics", room: "Room 101", students: 43 },
    { time: "2:00 PM", class: "11-B", subject: "Mathematics", room: "Room 105", students: 39 },
    { time: "3:00 PM", subject: "Free Period", type: "free" },
  ],
  Saturday: [
    { time: "8:00 AM", class: "12-A", subject: "Mathematics", room: "Room 105", students: 35 },
    { time: "9:00 AM", class: "12-B", subject: "Mathematics", room: "Room 104", students: 36 },
    { time: "10:00 AM", class: "11-A", subject: "Mathematics", room: "Room 104", students: 38 },
    { time: "11:00 AM", class: "11-B", subject: "Mathematics", room: "Room 105", students: 39 },
    { time: "12:00 PM", subject: "Lunch Break", type: "break" },
    { time: "1:00 PM", subject: "Extra Classes", type: "extra", class: "All", room: "Auditorium" },
    { time: "2:00 PM", subject: null },
    { time: "3:00 PM", subject: null },
  ],
}

const typeStyles = {
  class: "bg-emerald-100 text-emerald-700 border-emerald-200",
  break: "bg-amber-100 text-amber-700 border-amber-200",
  free: "bg-slate-100 text-slate-600 border-slate-200",
  meeting: "bg-purple-100 text-purple-700 border-purple-200",
  extra: "bg-blue-100 text-blue-700 border-blue-200",
}

export default function TeacherTimetablePage() {
  const [selectedDay, setSelectedDay] = useState("Monday")
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const currentDay = days.includes(today) ? today : "Monday"

  const todayClasses = teacherSchedule[selectedDay as keyof typeof teacherSchedule].filter(
    (slot) => slot.class && !slot.type,
  ).length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30">
      <TeacherSidebar />
      <div className="pl-64">
        <TeacherHeader />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Timetable</h1>
              <p className="text-muted-foreground">Your weekly teaching schedule</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-emerald-100 text-emerald-700 px-3 py-1.5">
                <Calendar className="h-4 w-4 mr-1.5" />
                {todayClasses} Classes Today
              </Badge>
            </div>
          </div>

          {/* Day Selector */}
          <div className="mb-6 flex flex-wrap gap-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                  selectedDay === day
                    ? "bg-emerald-600 text-white shadow-lg"
                    : day === currentDay
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-white text-muted-foreground hover:bg-slate-100",
                )}
              >
                {day}
                {day === currentDay && selectedDay !== day && <span className="ml-1 text-xs">(Today)</span>}
              </button>
            ))}
          </div>

          {/* Schedule */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedDay}'s Schedule
              </CardTitle>
              <CardDescription className="text-white/80">
                {selectedDay === currentDay ? "Today's teaching schedule" : `Teaching schedule for ${selectedDay}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {teacherSchedule[selectedDay as keyof typeof teacherSchedule].map((slot, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex items-center gap-4 p-4 transition-colors hover:bg-slate-50",
                      slot.type === "break" && "bg-amber-50/50",
                    )}
                  >
                    {/* Time */}
                    <div className="w-24 flex-shrink-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {slot.time}
                      </div>
                    </div>

                    {/* Class Card */}
                    {slot.subject ? (
                      <div
                        className={cn(
                          "flex-1 rounded-xl border p-4",
                          slot.type ? typeStyles[slot.type as keyof typeof typeStyles] : typeStyles.class,
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{slot.subject}</h3>
                            {slot.class && (
                              <div className="mt-1 flex items-center gap-3 text-sm opacity-80">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3.5 w-3.5" />
                                  Class {slot.class}
                                </span>
                                {slot.room && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {slot.room}
                                  </span>
                                )}
                                {slot.students && <span>{slot.students} students</span>}
                              </div>
                            )}
                          </div>
                          {!slot.type && (
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                              Take Attendance
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 rounded-xl border border-dashed border-slate-200 p-4 text-center text-muted-foreground">
                        No class scheduled
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Weekly Summary */}
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">28</div>
                <p className="text-sm text-muted-foreground">Total Classes/Week</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">8</div>
                <p className="text-sm text-muted-foreground">Different Sections</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-amber-600">6</div>
                <p className="text-sm text-muted-foreground">Free Periods</p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-purple-600">3</div>
                <p className="text-sm text-muted-foreground">Meetings/Week</p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
