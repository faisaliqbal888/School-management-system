"use client"

import { useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { TranscriptCard, TranscriptTrend } from "@/components/exams/transcript-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, FileText, GraduationCap, Loader2, Trophy, Users } from "lucide-react"
import { useTranscript } from "@/lib/hooks/use-exams"
import { useStudents } from "@/lib/hooks/use-students"
import { cn } from "@/lib/utils"

export default function ParentResultsPage() {
  const { ready } = useRequireRole("PARENT")
  const { students, isLoading: childrenLoading } = useStudents({ limit: 20 })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const childId = selectedId ?? students[0]?.id ?? null
  const selected = students.find((s) => s.id === childId) ?? students[0]
  const { transcript, isLoading, error } = useTranscript(childId)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Results</h1>
            <p className="mt-1 text-rose-100">
              Report cards for every published exam, child by child.
            </p>
          </div>

          {childrenLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <FileText className="h-7 w-7" />
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No children are linked to this account yet. Please contact the school office.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {students.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {students.map((child) => (
                    <button key={child.id} type="button" onClick={() => setSelectedId(child.id)}>
                      <Badge
                        variant={child.id === childId ? "default" : "outline"}
                        className="cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-normal"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {child.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Showing results for{" "}
                <span className="font-semibold text-foreground">{selected?.name}</span>
                {selected?.className ? ` · ${selected.className}` : ""}
                {selected?.sectionName ? `-${selected.sectionName}` : ""}
              </p>

              {error && (
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    {error}
                  </CardContent>
                </Card>
              )}

              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <Stat
                    icon={GraduationCap}
                    label="Exams published"
                    value={String(transcript?.exams.length ?? 0)}
                    tone="blue"
                  />
                  <Stat
                    icon={Trophy}
                    label="Overall percentage"
                    value={transcript?.overall ? `${transcript.overall.percent}%` : "—"}
                    tone="emerald"
                  />
                  <Stat
                    icon={FileText}
                    label="Total marks"
                    value={
                      transcript?.overall
                        ? `${transcript.overall.obtained}/${transcript.overall.total}`
                        : "—"
                    }
                    tone="violet"
                  />
                </div>
              )}

              <div className="grid gap-5 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TranscriptCard transcript={transcript} isLoading={isLoading} error={error} />
                </div>
                <TranscriptTrend transcript={transcript} />
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
  tone,
}: {
  icon: React.ElementType
  label: string
  value: string
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
        </div>
      </CardContent>
    </Card>
  )
}
