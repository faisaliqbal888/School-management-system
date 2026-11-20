"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Award,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  UserX,
} from "lucide-react"
import { useExamAnalysis } from "@/lib/hooks/use-exams"
import { cn } from "@/lib/utils"

interface ExamAnalysisPanelProps {
  examId: string | null
}

const BAND_ORDER = ["A+", "A", "B", "C", "D", "E", "F"] as const
const BAND_COLORS: Record<string, string> = {
  "A+": "bg-emerald-500",
  A: "bg-emerald-400",
  B: "bg-blue-500",
  C: "bg-amber-500",
  D: "bg-orange-500",
  E: "bg-red-400",
  F: "bg-red-600",
}

export function ExamAnalysisPanel({ examId }: ExamAnalysisPanelProps) {
  const { analysis, isLoading, error } = useExamAnalysis(examId)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <BarChart3 className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Choose an exam with recorded marks to see its analysis.
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxBand = Math.max(1, ...BAND_ORDER.map((b) => analysis.bands[b] ?? 0))

  const cards = [
    {
      label: "Average",
      value: analysis.average !== null ? `${analysis.average} / ${analysis.exam.totalMarks}` : "—",
      icon: TrendingUp,
      tone: "text-blue-600 bg-blue-50",
    },
    {
      label: "Highest",
      value: analysis.highest !== null ? String(analysis.highest) : "—",
      icon: Award,
      tone: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Lowest",
      value: analysis.lowest !== null ? String(analysis.lowest) : "—",
      icon: TrendingDown,
      tone: "text-amber-600 bg-amber-50",
    },
    {
      label: "Pass rate",
      value: analysis.passRate !== null ? `${analysis.passRate}%` : "—",
      icon: UserCheck,
      tone: "text-violet-600 bg-violet-50",
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", c.tone)}>
                <c.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="text-lg font-bold">{c.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Grade distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Grade distribution</CardTitle>
            <p className="text-xs text-muted-foreground">
              {analysis.count} result{analysis.count === 1 ? "" : "s"} ·{" "}
              {analysis.exam.className} · {analysis.exam.subjectName}
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {BAND_ORDER.map((band) => {
              const count = analysis.bands[band] ?? 0
              return (
                <div key={band} className="flex items-center gap-2">
                  <span className="w-7 text-xs font-medium">{band}</span>
                  <div className="h-5 flex-1 overflow-hidden rounded-md bg-muted">
                    <div
                      className={cn("h-full rounded-md transition-all", BAND_COLORS[band])}
                      style={{ width: `${(count / maxBand) * 100}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-xs text-muted-foreground">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Pass / fail + toppers */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Pass &amp; fail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Progress
                value={analysis.passRate ?? 0}
                className="h-2.5 [&>div]:bg-emerald-500"
              />
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <UserCheck className="h-4 w-4" />
                  {analysis.passCount} passed
                </span>
                <span className="flex items-center gap-1.5 text-red-600">
                  <UserX className="h-4 w-4" />
                  {analysis.failCount} failed
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Pass mark is {analysis.exam.passingMarks} of {analysis.exam.totalMarks}.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Top performers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {analysis.toppers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No results recorded yet.</p>
              ) : (
                analysis.toppers.map((t, i) => (
                  <div
                    key={t.admissionNo}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn(
                          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      <span className="truncate">{t.name}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-medium">{t.marks}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {t.grade}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
