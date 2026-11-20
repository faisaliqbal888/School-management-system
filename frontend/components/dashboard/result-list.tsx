"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { gradeTone, shortDate, type ResultLite } from "@/lib/hooks/use-dashboard"

interface Props {
  results: ResultLite[] | undefined
  isLoading?: boolean
  title?: string
  /** Parents see one child at a time — show whose result it is. */
  showStudent?: boolean
}

export function ResultList({ results, isLoading, title, showStudent }: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title ?? "Latest results"}</CardTitle>
        <p className="text-sm text-muted-foreground">Newest published exams first</p>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : (results?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No results have been published yet.
          </p>
        ) : (
          <ul className="divide-y">
            {results?.map((result) => (
              <li key={result.id} className="flex items-center gap-3 py-2.5">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                    gradeTone(result.grade),
                  )}
                >
                  {result.grade ?? "—"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {result.subjectName}
                    {showStudent && (
                      <span className="ml-1 font-normal text-muted-foreground">· {result.studentName}</span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {result.title} · {shortDate(result.date)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {result.marksObtained ?? "—"}/{result.totalMarks}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {result.percent !== null ? `${result.percent}%` : "absent"}
                  </p>
                </div>
                {result.passed !== null && (
                  <Badge
                    variant={result.passed ? "secondary" : "destructive"}
                    className="hidden shrink-0 sm:inline-flex"
                  >
                    {result.passed ? "pass" : "fail"}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
