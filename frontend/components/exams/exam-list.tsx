"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  Users,
} from "lucide-react"
import { formatDate } from "@/lib/format"
import { EXAM_STATUS_LABEL, EXAM_TYPE_LABEL, type ExamRow, type ExamStatus } from "@/lib/hooks/use-exams"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<ExamStatus, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
  ONGOING: "bg-amber-50 text-amber-700 border-amber-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
  PUBLISHED: "bg-emerald-50 text-emerald-700 border-emerald-200",
}

interface ExamListProps {
  exams: ExamRow[]
  isLoading?: boolean
  error?: string | null
  /** Admin/teacher actions */
  canManage?: boolean
  onEnterMarks?: (exam: ExamRow) => void
  onAnalyse?: (exam: ExamRow) => void
  onPublish?: (exam: ExamRow) => void
  onDelete?: (exam: ExamRow) => void
  /** Student/parent */
  onViewResult?: (exam: ExamRow) => void
}

export function ExamList({
  exams,
  isLoading = false,
  error = null,
  canManage = false,
  onEnterMarks,
  onAnalyse,
  onPublish,
  onDelete,
  onViewResult,
}: ExamListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium">No exams found</p>
          <p className="text-sm text-muted-foreground">
            {canManage
              ? "Schedule an exam to start collecting marks."
              : "Results will appear here once your teachers publish them."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {exams.map((exam) => {
        const complete = exam.resultCount > 0
        return (
          <Card key={exam.id} className="transition-shadow hover:shadow-sm">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    exam.status === "PUBLISHED"
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-primary/10 text-primary",
                  )}
                >
                  {exam.status === "PUBLISHED" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <ClipboardList className="h-5 w-5" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{exam.name}</p>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {EXAM_TYPE_LABEL[exam.type]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", STATUS_STYLES[exam.status])}
                    >
                      {EXAM_STATUS_LABEL[exam.status]}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-muted-foreground">
                    {exam.className}
                    {exam.sectionName ? `-${exam.sectionName}` : ""} · {exam.subjectName} ·{" "}
                    {formatDate(exam.examDate)}
                    {exam.startTime ? ` · ${exam.startTime}` : ""} · {exam.durationMin} min
                  </p>

                  <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {exam.resultCount} result{exam.resultCount === 1 ? "" : "s"}
                    </span>
                    <span>Total {exam.totalMarks}</span>
                    <span>Pass {exam.passingMarks}</span>
                    {exam.averagePercent !== null && (
                      <span className="font-medium text-foreground">Avg {exam.averagePercent}%</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1 sm:justify-end">
                {!canManage && onViewResult && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onViewResult(exam)}>
                    <Eye className="h-3.5 w-3.5" />
                    Result
                  </Button>
                )}

                {canManage && (
                  <>
                    <Button
                      variant={complete ? "outline" : "default"}
                      size="sm"
                      className="gap-1.5"
                      onClick={() => onEnterMarks?.(exam)}
                      disabled={!exam.canEnterMarks}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {complete ? "Edit marks" : "Enter marks"}
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEnterMarks?.(exam)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Marks entry
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onAnalyse?.(exam)} disabled={!complete}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Analysis
                        </DropdownMenuItem>
                        {exam.status !== "PUBLISHED" && (
                          <DropdownMenuItem onClick={() => onPublish?.(exam)} disabled={!exam.canPublish}>
                            <Upload className="mr-2 h-4 w-4" />
                            Publish results
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete?.(exam)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete exam
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
