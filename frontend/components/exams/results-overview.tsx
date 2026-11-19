"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"

const gradeDistribution = [
  { grade: "A+", count: 45, color: "oklch(0.70 0.20 145)" },
  { grade: "A", count: 78, color: "oklch(0.70 0.20 145)" },
  { grade: "B", count: 124, color: "oklch(0.55 0.25 265)" },
  { grade: "C", count: 89, color: "oklch(0.75 0.18 85)" },
  { grade: "D", count: 56, color: "oklch(0.70 0.20 50)" },
  { grade: "F", count: 28, color: "oklch(0.60 0.22 25)" },
]

const subjectPerformance = [
  { subject: "Math", average: 78 },
  { subject: "Science", average: 82 },
  { subject: "English", average: 75 },
  { subject: "History", average: 70 },
  { subject: "Computer", average: 85 },
]

const radarData = [
  { subject: "Mathematics", A: 85, B: 75 },
  { subject: "Science", A: 82, B: 78 },
  { subject: "English", A: 78, B: 72 },
  { subject: "History", A: 72, B: 68 },
  { subject: "Computer", A: 90, B: 82 },
]

export function ResultsOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Grade Distribution */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Grade Distribution</CardTitle>
          <p className="text-xs text-muted-foreground">Overall grade breakdown</p>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" vertical={false} />
                <XAxis
                  dataKey="grade"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.01 270)",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="count" fill="oklch(0.55 0.25 265)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Subject Performance */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Subject Performance</CardTitle>
          <p className="text-xs text-muted-foreground">Average scores by subject</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {subjectPerformance.map((subject) => (
            <div key={subject.subject} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{subject.subject}</span>
                <span className="font-medium">{subject.average}%</span>
              </div>
              <Progress value={subject.average} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Class Comparison Radar */}
      <Card className="border-0 shadow-sm md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Class Comparison</CardTitle>
          <p className="text-xs text-muted-foreground">Performance comparison between Class 8-A and 8-B</p>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.92 0.01 270)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 10 }} />
                <Radar
                  name="Class 8-A"
                  dataKey="A"
                  stroke="oklch(0.55 0.25 265)"
                  fill="oklch(0.55 0.25 265)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Radar
                  name="Class 8-B"
                  dataKey="B"
                  stroke="oklch(0.75 0.18 160)"
                  fill="oklch(0.75 0.18 160)"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.01 270)",
                    borderRadius: "12px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span className="text-xs text-muted-foreground">Class 8-A</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs text-muted-foreground">Class 8-B</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
