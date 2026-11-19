"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

const weeklyData = [
  { class: "6-A", attendance: 95 },
  { class: "6-B", attendance: 92 },
  { class: "7-A", attendance: 88 },
  { class: "7-B", attendance: 94 },
  { class: "8-A", attendance: 91 },
  { class: "8-B", attendance: 89 },
  { class: "9-A", attendance: 96 },
  { class: "9-B", attendance: 93 },
  { class: "10-A", attendance: 97 },
  { class: "10-B", attendance: 90 },
]

const pieData = [
  { name: "Present", value: 2680, color: "oklch(0.70 0.20 145)" },
  { name: "Absent", value: 120, color: "oklch(0.60 0.22 25)" },
  { name: "Late", value: 47, color: "oklch(0.75 0.18 85)" },
]

export function AttendanceReport() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Bar Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Class-wise Attendance</CardTitle>
          <p className="text-xs text-muted-foreground">Today&apos;s attendance by class</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" vertical={false} />
                <XAxis
                  dataKey="class"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 10 }}
                  domain={[80, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.01 270)",
                    borderRadius: "12px",
                  }}
                  formatter={(value) => [`${Number(value)}%`, "Attendance"]}
                />
                <Bar dataKey="attendance" fill="oklch(0.55 0.25 265)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Overall Status</CardTitle>
          <p className="text-xs text-muted-foreground">School-wide attendance breakdown</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.01 270)",
                    borderRadius: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-muted-foreground">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
