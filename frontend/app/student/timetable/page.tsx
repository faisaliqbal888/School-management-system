"use client"

import { useState } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, MapPin, User, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = ["8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM"]

const schedule = {
  Monday: [
    { time: "8:00 AM", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 101", type: "lecture" },
    { time: "9:00 AM", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 101", type: "lecture" },
    { time: "10:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Lab 201", type: "practical" },
    { time: "11:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Lab 201", type: "practical" },
    { time: "12:00 PM", subject: "Lunch Break", teacher: "", room: "Cafeteria", type: "break" },
    { time: "1:00 PM", subject: "English", teacher: "Ms. Patel", room: "Room 102", type: "lecture" },
    { time: "2:00 PM", subject: "Computer Science", teacher: "Mr. Kumar", room: "Lab 301", type: "practical" },
    { time: "3:00 PM", subject: "Computer Science", teacher: "Mr. Kumar", room: "Lab 301", type: "practical" },
  ],
  Tuesday: [
    { time: "8:00 AM", subject: "Chemistry", teacher: "Dr. Singh", room: "Lab 202", type: "practical" },
    { time: "9:00 AM", subject: "Chemistry", teacher: "Dr. Singh", room: "Lab 202", type: "practical" },
    { time: "10:00 AM", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 101", type: "lecture" },
    { time: "11:00 AM", subject: "English", teacher: "Ms. Patel", room: "Room 102", type: "lecture" },
    { time: "12:00 PM", subject: "Lunch Break", teacher: "", room: "Cafeteria", type: "break" },
    { time: "1:00 PM", subject: "Physical Education", teacher: "Mr. Rao", room: "Sports Ground", type: "practical" },
    { time: "2:00 PM", subject: "Physical Education", teacher: "Mr. Rao", room: "Sports Ground", type: "practical" },
    { time: "3:00 PM", subject: "Library", teacher: "", room: "Library", type: "self-study" },
  ],
  Wednesday: [
    { time: "8:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Room 103", type: "lecture" },
    { time: "9:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Room 103", type: "lecture" },
    { time: "10:00 AM", subject: "Chemistry", teacher: "Dr. Singh", room: "Room 104", type: "lecture" },
    { time: "11:00 AM", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 101", type: "lecture" },
    { time: "12:00 PM", subject: "Lunch Break", teacher: "", room: "Cafeteria", type: "break" },
    { time: "1:00 PM", subject: "Computer Science", teacher: "Mr. Kumar", room: "Room 105", type: "lecture" },
    { time: "2:00 PM", subject: "English", teacher: "Ms. Patel", room: "Room 102", type: "lecture" },
    { time: "3:00 PM", subject: "Art", teacher: "Mrs. Mehta", room: "Art Room", type: "practical" },
  ],
  Thursday: [
    { time: "8:00 AM", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 101", type: "lecture" },
    { time: "9:00 AM", subject: "Chemistry", teacher: "Dr. Singh", room: "Lab 202", type: "practical" },
    { time: "10:00 AM", subject: "Chemistry", teacher: "Dr. Singh", room: "Lab 202", type: "practical" },
    { time: "11:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Room 103", type: "lecture" },
    { time: "12:00 PM", subject: "Lunch Break", teacher: "", room: "Cafeteria", type: "break" },
    { time: "1:00 PM", subject: "English", teacher: "Ms. Patel", room: "Room 102", type: "lecture" },
    { time: "2:00 PM", subject: "Music", teacher: "Mr. Das", room: "Music Room", type: "practical" },
    { time: "3:00 PM", subject: "Computer Science", teacher: "Mr. Kumar", room: "Lab 301", type: "practical" },
  ],
  Friday: [
    { time: "8:00 AM", subject: "English", teacher: "Ms. Patel", room: "Room 102", type: "lecture" },
    { time: "9:00 AM", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 101", type: "lecture" },
    { time: "10:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Lab 201", type: "practical" },
    { time: "11:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Lab 201", type: "practical" },
    { time: "12:00 PM", subject: "Lunch Break", teacher: "", room: "Cafeteria", type: "break" },
    { time: "1:00 PM", subject: "Chemistry", teacher: "Dr. Singh", room: "Room 104", type: "lecture" },
    { time: "2:00 PM", subject: "Computer Science", teacher: "Mr. Kumar", room: "Room 105", type: "lecture" },
    { time: "3:00 PM", subject: "Assembly", teacher: "", room: "Auditorium", type: "event" },
  ],
  Saturday: [
    { time: "8:00 AM", subject: "Mathematics", teacher: "Mr. Sharma", room: "Room 101", type: "lecture" },
    { time: "9:00 AM", subject: "Physics", teacher: "Mrs. Gupta", room: "Room 103", type: "lecture" },
    { time: "10:00 AM", subject: "Chemistry", teacher: "Dr. Singh", room: "Room 104", type: "lecture" },
    { time: "11:00 AM", subject: "English", teacher: "Ms. Patel", room: "Room 102", type: "lecture" },
    { time: "12:00 PM", subject: "Lunch Break", teacher: "", room: "Cafeteria", type: "break" },
    { time: "1:00 PM", subject: "Sports/Clubs", teacher: "", room: "Various", type: "activity" },
    { time: "2:00 PM", subject: "Sports/Clubs", teacher: "", room: "Various", type: "activity" },
    { time: "3:00 PM", subject: null, teacher: "", room: "", type: "" },
  ],
}

const typeColors = {
  lecture: "bg-blue-100 text-blue-700 border-blue-200",
  practical: "bg-emerald-100 text-emerald-700 border-emerald-200",
  break: "bg-amber-100 text-amber-700 border-amber-200",
  "self-study": "bg-purple-100 text-purple-700 border-purple-200",
  event: "bg-rose-100 text-rose-700 border-rose-200",
  activity: "bg-cyan-100 text-cyan-700 border-cyan-200",
}

export default function StudentTimetablePage() {
  const [selectedDay, setSelectedDay] = useState("Monday")
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" })
  const currentDay = days.includes(today) ? today : "Monday"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <StudentSidebar />
      <div className="pl-64">
        <StudentHeader />
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">My Timetable</h1>
            <p className="text-muted-foreground">View your weekly class schedule</p>
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
                    ? "bg-blue-600 text-white shadow-lg"
                    : day === currentDay
                      ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                      : "bg-white text-muted-foreground hover:bg-slate-100",
                )}
              >
                {day}
                {day === currentDay && selectedDay !== day && <span className="ml-1 text-xs">(Today)</span>}
              </button>
            ))}
          </div>

          {/* Schedule Grid */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {selectedDay}'s Schedule
              </CardTitle>
              <CardDescription className="text-white/80">
                {selectedDay === currentDay ? "Today's classes" : `Classes for ${selectedDay}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {schedule[selectedDay as keyof typeof schedule].map((slot, index) => (
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

                    {/* Subject Card */}
                    {slot.subject ? (
                      <div
                        className={cn(
                          "flex-1 rounded-xl border p-4",
                          typeColors[slot.type as keyof typeof typeColors] || "bg-slate-100",
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{slot.subject}</h3>
                            {slot.teacher && (
                              <div className="mt-1 flex items-center gap-1.5 text-sm opacity-80">
                                <User className="h-3.5 w-3.5" />
                                {slot.teacher}
                              </div>
                            )}
                            {slot.room && (
                              <div className="mt-0.5 flex items-center gap-1.5 text-sm opacity-80">
                                <MapPin className="h-3.5 w-3.5" />
                                {slot.room}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {slot.type}
                          </Badge>
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

          {/* Weekly Overview */}
          <Card className="mt-6 border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Weekly Overview</CardTitle>
              <CardDescription>Quick view of all your classes this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left font-medium text-muted-foreground">Time</th>
                      {days.map((day) => (
                        <th
                          key={day}
                          className={cn(
                            "p-2 text-center font-medium",
                            day === currentDay ? "text-blue-600" : "text-muted-foreground",
                          )}
                        >
                          {day.slice(0, 3)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((time, timeIndex) => (
                      <tr key={time} className="border-b last:border-0">
                        <td className="p-2 text-muted-foreground">{time}</td>
                        {days.map((day) => {
                          const slot = schedule[day as keyof typeof schedule][timeIndex]
                          return (
                            <td key={day} className="p-1 text-center">
                              {slot?.subject ? (
                                <div
                                  className={cn(
                                    "rounded-lg px-2 py-1 text-xs font-medium truncate max-w-[100px]",
                                    typeColors[slot.type as keyof typeof typeColors] || "bg-slate-100",
                                  )}
                                  title={slot.subject}
                                >
                                  {slot.subject.length > 10 ? slot.subject.slice(0, 10) + "..." : slot.subject}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
