"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { CheckCircle2, ChevronDown, FileText, Printer, TrendingUp, XCircle } from "lucide-react"
import { formatDate } from "@/lib/format"
import type { Transcript } from "@/lib/hooks/use-exams"
import { cn } from "@/lib/utils"

interface TranscriptCardProps {
  transcript: Transcript | undefined
  isLoading: boolean
  error?: string | null
  /** Hide the "print" affordance inside a dialog. */
  showPrint?: boolean
}

function gradeTone(grade: string): string {
  if (grade.startsWith("A")) return "bg-emerald-50 text-emerald-700 border-emerald-200"
  if (grade === "B") return "bg-blue-50 text-blue-700 border-blue-200"
  if (grade === "C") return "bg-amber-50 text-amber-700 border-amber-200"
  if (grade === "D" || grade === "E") return "bg-orange-50 text-orange-700 border-orange-200"
  return "bg-red-50 text-red-700 border-red-200"
}

export function TranscriptCard({
  transcript,
  isLoading,
  error = null,
  showPrint = true,
}: TranscriptCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
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

  if (!transcript) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <FileText className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No published results yet. Your report card appears once teachers publish marks.
          </p>
        </CardContent>
      </Card>
    )
  }

  const overallGrade =
    transcript.overall === null
      ? "—"
      : transcript.overall.percent >= 90
        ? "A+"
        : transcript.overall.percent >= 80
          ? "A"
          : transcript.overall.percent >= 70
            ? "B"
            : transcript.overall.percent >= 60
              ? "C"
              : transcript.overall.percent >= 50
                ? "D"
                : transcript.overall.percent >= 40
                  ? "E"
                  : "F"

  return (
    <div className="space-y-4">
      {/* header card */}
      <Card className="overflow-hidden border-0 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-indigo-100">Report card</p>
              <h2 className="mt-1 text-2xl font-bold">{transcript.student.name}</h2>
              <p className="mt-1 text-sm text-indigo-100">
                {transcript.student.admissionNo}
                {transcript.student.rollNo ? ` · Roll ${transcript.student.rollNo}` : ""} ·{" "}
                {transcript.student.className}
                {transcript.student.sectionName ? `-${transcript.student.sectionName}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {transcript.overall && (
                <div className="text-right">
                  <p className="text-xs text-indigo-100">Overall</p>
                  <p className="text-3xl font-bold">{transcript.overall.percent}%</p>
                  <p className="text-xs text-indigo-100">
                    {transcript.overall.obtained} / {transcript.overall.total} marks
                  </p>
                </div>
              )}
              <Badge className="border-0 bg-white/20 text-lg font-bold text-white">
                {overallGrade}
              </Badge>
              {showPrint && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.print()}
                  className="text-white hover:bg-white/20 hover:text-white"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {transcript.exams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
            <FileText className="h-7 w-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No published exams yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={transcript.exams.slice(-1).map((e) => e.examId)}>
          {[...transcript.exams].reverse().map((exam) => (
            <AccordionItem key={exam.examId} value={exam.examId} className="border-b">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-1 flex-wrap items-center gap-2 pr-2 text-left">
                  <span className="font-medium">{exam.examName}</span>
                  <Badge variant="outline" className="text-[10px] font-normal">
                    {formatDate(exam.examDate)}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px]", gradeTone(exam.grade))}>
                    {exam.grade} · {exam.percent}%
                  </Badge>
                  {exam.passed ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Passed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-red-600">
                      <XCircle className="h-3.5 w-3.5" />
                      Failed
                    </span>
                  )}
                  <span className="ml-auto text-xs text-muted-foreground">
                    {exam.obtained}/{exam.total}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-hidden rounded-lg border border-border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-left">
                      <tr>
                        <th className="px-3 py-2 font-medium">Subject</th>
                        <th className="px-3 py-2 text-right font-medium">Marks</th>
                        <th className="px-3 py-2 text-right font-medium">%</th>
                        <th className="px-3 py-2 text-right font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {exam.subjects.map((s) => (
                        <tr key={s.subject} className="border-t border-border">
                          <td className="px-3 py-2">{s.subject}</td>
                          <td className="px-3 py-2 text-right font-mono">
                            {s.marks} / {s.total}
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{s.percent}%</td>
                          <td className="px-3 py-2 text-right">
                            <Badge
                              variant="outline"
                              className={cn("text-[10px]", gradeTone(s.grade ?? "F"))}
                            >
                              {s.grade ?? "—"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  )
}

/** Progress trend across exams — used on student/parent dashboards. */
export function TranscriptTrend({ transcript }: { transcript: Transcript | undefined }) {
  const [open, setOpen] = useState(true)

  if (!transcript || transcript.exams.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Performance trend</CardTitle>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </Button>
      </CardHeader>
      {open && (
        <CardContent className="space-y-3">
          {transcript.exams.map((exam) => (
            <div key={exam.examId}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium">{exam.examName}</span>
                <span className="text-muted-foreground">
                  {exam.percent}% · {exam.grade}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full",
                    exam.percent >= 80
                      ? "bg-emerald-500"
                      : exam.percent >= 60
                        ? "bg-blue-500"
                        : exam.percent >= 40
                          ? "bg-amber-500"
                          : "bg-red-500",
                  )}
                  style={{ width: `${exam.percent}%` }}
                />
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
