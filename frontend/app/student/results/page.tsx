"use client"

import { useRequireRole } from "@/lib/auth-context"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { TranscriptCard, TranscriptTrend } from "@/components/exams/transcript-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, BookOpen, GraduationCap, Loader2, Trophy } from "lucide-react"
import { useResults, useTranscript } from "@/lib/hooks/use-exams"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

export default function StudentResultsPage() {
  const { ready } = useRequireRole("STUDENT")
  const { transcript, isLoading, error } = useTranscript()
  const { results, isLoading: resultsLoading } = useResults({ page: 1, limit: 50 })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const best = results.reduce<{ percent: number; subject: string } | null>((acc, r) => {
    if (!acc || r.percent > acc.percent) return { percent: r.percent, subject: r.subjectName }
    return acc
  }, null)

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <StudentHeader />
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">My Results</h1>
            <p className="text-muted-foreground">
              Report cards and subject-wise marks for every published exam
            </p>
          </div>

          {error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Stat
                  icon={GraduationCap}
                  label="Exams published"
                  value={String(transcript?.exams.length ?? 0)}
                  hint="with results"
                  tone="blue"
                />
                <Stat
                  icon={Trophy}
                  label="Overall percentage"
                  value={transcript?.overall ? `${transcript.overall.percent}%` : "—"}
                  hint={
                    transcript?.overall
                      ? `${transcript.overall.obtained}/${transcript.overall.total} marks`
                      : "no results yet"
                  }
                  tone="emerald"
                />
                <Stat
                  icon={BookOpen}
                  label="Best subject"
                  value={best ? `${best.percent}%` : "—"}
                  hint={best?.subject ?? "—"}
                  tone="violet"
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TranscriptCard transcript={transcript} isLoading={isLoading} />
                </div>
                <div className="space-y-5">
                  <TranscriptTrend transcript={transcript} />

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Recent subject marks</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      {resultsLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                          <Skeleton key={i} className="h-10 w-full" />
                        ))
                      ) : results.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No marks published yet.</p>
                      ) : (
                        results.slice(0, 8).map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-border p-2 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium">{r.subjectName}</p>
                              <p className="text-xs text-muted-foreground">
                                {r.examName} · {formatDate(r.examDate)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="font-mono text-xs">
                                {r.marksObtained}/{r.totalMarks}
                              </p>
                              <p
                                className={cn(
                                  "text-[10px]",
                                  r.passed ? "text-emerald-600" : "text-red-600",
                                )}
                              >
                                {r.grade} · {r.percent}%
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  hint: string
  tone: "blue" | "emerald" | "violet"
}) {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
  }
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-[10px] text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  )
}
