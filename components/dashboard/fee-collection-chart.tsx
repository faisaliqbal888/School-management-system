"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { month: "Jan", collected: 45000, pending: 12000 },
  { month: "Feb", collected: 52000, pending: 8000 },
  { month: "Mar", collected: 48000, pending: 15000 },
  { month: "Apr", collected: 61000, pending: 9000 },
  { month: "May", collected: 55000, pending: 11000 },
  { month: "Jun", collected: 67000, pending: 7000 },
]

export function FeeCollectionChart() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Fee Collection</CardTitle>
        <p className="text-sm text-muted-foreground">Monthly fee collection status</p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" vertical={false} />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(1 0 0)",
                  border: "1px solid oklch(0.92 0.01 270)",
                  borderRadius: "12px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, ""]}
                labelStyle={{ color: "oklch(0.20 0.02 270)", fontWeight: 600 }}
              />
              <Bar dataKey="collected" fill="oklch(0.70 0.20 145)" radius={[6, 6, 0, 0]} name="Collected" />
              <Bar dataKey="pending" fill="oklch(0.75 0.18 85)" radius={[6, 6, 0, 0]} name="Pending" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 pt-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-success" />
            <span className="text-sm text-muted-foreground">Collected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
