"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { cn } from "@/lib/utils"
import type { Trend } from "@/lib/hooks/use-dashboard"

interface Props {
  trend: Trend | undefined
  title?: string
  description?: string
  className?: string
  /** Hide the absolute head-count axis for single-learner views. */
  compact?: boolean
}

const dayLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { weekday: "short" })

export function AttendanceChart({ trend, title, description, className, compact }: Props) {
  const series = trend?.series ?? []
  const overall = trend?.overall
  const hasData = series.some((day) => day.total > 0)

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title ?? "Attendance — last 7 days"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {description ?? "Present + late as a share of marked attendance"}
          </p>
        </div>
        {overall?.rate !== null && overall?.rate !== undefined && (
          <Badge
            className={cn(
              "shrink-0",
              overall.rate >= 90
                ? "bg-emerald-100 text-emerald-700"
                : overall.rate >= 75
                  ? "bg-amber-100 text-amber-700"
                  : "bg-rose-100 text-rose-700",
            )}
          >
            {overall.rate}% overall
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        {!hasData ? (
          <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
            No attendance has been marked in the last 7 days.
          </div>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={series.map((day) => ({ ...day, label: dayLabel(day.date) }))}
                margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.25 265)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.55 0.25 265)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 270)" vertical={false} />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "oklch(0.50 0.02 270)", fontSize: 12 }}
                  domain={compact ? [0, 100] : [0, "auto"]}
                  width={44}
                />
                <Tooltip
                  formatter={(value) => [`${value}`, compact ? "Attendance %" : "Present"]}
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.92 0.01 270)",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey={compact ? "rate" : "present"}
                  stroke="oklch(0.55 0.25 265)"
                  strokeWidth={3}
                  fill="url(#attendanceGradient)"
                  dot={{ fill: "oklch(0.55 0.25 265)", strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 6, fill: "oklch(0.55 0.25 265)", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {overall && (
          <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Present</p>
              <p className="text-lg font-semibold text-emerald-600">{overall.present}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Late</p>
              <p className="text-lg font-semibold text-amber-600">{overall.late}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Absent</p>
              <p className="text-lg font-semibold text-rose-600">{overall.absent}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
