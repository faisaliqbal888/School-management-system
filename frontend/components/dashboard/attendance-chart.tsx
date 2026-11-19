"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { day: "Mon", present: 92, absent: 8 },
  { day: "Tue", present: 95, absent: 5 },
  { day: "Wed", present: 88, absent: 12 },
  { day: "Thu", present: 94, absent: 6 },
  { day: "Fri", present: 91, absent: 9 },
  { day: "Sat", present: 78, absent: 22 },
]

export function AttendanceChart() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Weekly Attendance</CardTitle>
        <p className="text-sm text-muted-foreground">Student attendance overview this week</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="presentGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.55 0.25 265)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.55 0.25 265)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" vertical={false} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.92 0.01 270)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                labelStyle={{ color: "oklch(0.20 0.02 270)", fontWeight: 600 }}
              />
              <Area
                type="monotone"
                dataKey="present"
                stroke="oklch(0.55 0.25 265)"
                strokeWidth={3}
                fill="url(#presentGradient)"
                dot={{ fill: "oklch(0.55 0.25 265)", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: "oklch(0.55 0.25 265)", strokeWidth: 2, stroke: "#fff" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
