"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const monthlyData = [
  { month: "Jul", collected: 180000, target: 200000 },
  { month: "Aug", collected: 195000, target: 200000 },
  { month: "Sep", collected: 210000, target: 200000 },
  { month: "Oct", collected: 188000, target: 200000 },
  { month: "Nov", collected: 220000, target: 200000 },
  { month: "Dec", collected: 165000, target: 200000 },
]

export function FeeCollectionStats() {
  const totalCollected = 1158000
  const totalTarget = 1400000
  const collectionRate = Math.round((totalCollected / totalTarget) * 100)

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Collection Progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Collection Progress</CardTitle>
          <p className="text-xs text-muted-foreground">Academic Year 2025-2026</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold">${(totalCollected / 1000).toFixed(0)}K</span>
              <span className="text-sm text-muted-foreground">of ${(totalTarget / 1000).toFixed(0)}K target</span>
            </div>
            <Progress value={collectionRate} className="h-3" />
            <p className="text-sm text-muted-foreground">{collectionRate}% collected</p>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-2xl font-bold text-success">$1.16M</p>
              <p className="text-xs text-muted-foreground">Collected</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warning">$180K</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-destructive">$62K</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Monthly Collection Trend</CardTitle>
          <p className="text-xs text-muted-foreground">Collected vs Target</p>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 11 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 11 }}
                  tickFormatter={(value) => `$${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.01 270)",
                    borderRadius: "12px",
                  }}
                  formatter={(value) => [`$${(Number(value) / 1000).toFixed(0)}K`, ""]}
                />
                <Line
                  type="monotone"
                  dataKey="collected"
                  stroke="oklch(0.55 0.25 265)"
                  strokeWidth={3}
                  dot={{ fill: "oklch(0.55 0.25 265)", strokeWidth: 0, r: 4 }}
                  name="Collected"
                />
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="oklch(0.75 0.02 270)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Target"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
