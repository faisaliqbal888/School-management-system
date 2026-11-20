"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  AlertCircle,
  Calculator,
  Check,
  ChevronsRight,
  Info,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Upload,
  Users,
} from "lucide-react"
import { formatDate } from "@/lib/format"
import {
  gradeFor,
  useMarksRoster,
  useSaveMarks,
  useUpdateExamStatus,
  type MarksRoster,
} from "@/lib/hooks/use-exams"
import { cn } from "@/lib/utils"

interface MarksEntryProps {
  examId: string | null
  /** Called after a successful save so parents can refresh the list. */
  onSaved?: () => void
  isAdmin?: boolean
}

interface Draft {
  [studentId: string]: { raw: string; remarks: string }
}

export function MarksEntry({ examId, onSaved, isAdmin = false }: MarksEntryProps) {
  const { roster, isLoading, error, refetch } = useMarksRoster(examId)
  const saveMarks = useSaveMarks()
  const updateStatus = useUpdateExamStatus()

  const [draft, setDraft] = useState<Draft>({})
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // hydrate whenever the roster loads
  useEffect(() => {
    if (!roster) return
    const next: Draft = {}
    for (const e of roster.entries) {
      next[e.studentId] = {
        raw: e.marksObtained === null ? "" : String(e.marksObtained),
        remarks: e.remarks ?? "",
      }
    }
    setDraft(next)
    setSearch("")
  }, [roster])

  const totalMarks = roster?.exam.totalMarks ?? 100

  const filtered = useMemo(() => {
    if (!roster) return []
    const term = search.trim().toLowerCase()
    if (!term) return roster.entries
    return roster.entries.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        (e.rollNo ?? "").toLowerCase().includes(term) ||
        e.admissionNo.toLowerCase().includes(term),
    )
  }, [roster, search])

  const dirty = useMemo(() => {
    if (!roster) return false
    return roster.entries.some((e) => {
      const d = draft[e.studentId]
      if (!d) return false
      const original = e.marksObtained === null ? "" : String(e.marksObtained)
      return d.raw !== original || d.remarks !== (e.remarks ?? "")
    })
  }, [roster, draft])

  const liveStats = useMemo(() => {
    if (!roster) return { entered: 0, invalid: 0, average: null as number | null }
    let entered = 0
    let invalid = 0
    let sum = 0
    for (const e of roster.entries) {
      const raw = draft[e.studentId]?.raw ?? ""
      if (raw.trim() === "") continue
      const value = Number(raw)
      if (!Number.isFinite(value) || value < 0 || value > totalMarks) {
        invalid += 1
        continue
      }
      entered += 1
      sum += value
    }
    return {
      entered,
      invalid,
      average: entered === 0 ? null : Math.round((sum / entered / totalMarks) * 1000) / 10,
    }
  }, [roster, draft, totalMarks])

  const setMarks = (studentId: string, raw: string) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { raw, remarks: prev[studentId]?.remarks ?? "" },
    }))
  }

  const setRemarks = (studentId: string, remarks: string) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: { raw: prev[studentId]?.raw ?? "", remarks },
    }))
  }

  const fillAll = (value: string) => {
    if (!roster) return
    const next: Draft = {}
    for (const e of roster.entries) next[e.studentId] = { raw: value, remarks: draft[e.studentId]?.remarks ?? "" }
    setDraft(next)
  }

  const reset = () => {
    if (!roster) return
    const next: Draft = {}
    for (const e of roster.entries) {
      next[e.studentId] = {
        raw: e.marksObtained === null ? "" : String(e.marksObtained),
        remarks: e.remarks ?? "",
      }
    }
    setDraft(next)
  }

  const handleSave = async () => {
    if (!roster || !examId) return
    if (liveStats.invalid > 0) {
      toast.error("Fix invalid marks first", {
        description: `${liveStats.invalid} entries are outside 0–${totalMarks}.`,
      })
      return
    }

    const entries = roster.entries.map((e) => {
      const raw = draft[e.studentId]?.raw ?? ""
      return {
        studentId: e.studentId,
        marksObtained: raw.trim() === "" ? null : Number(raw),
        remarks: draft[e.studentId]?.remarks.trim() || null,
      }
    })

    setSaving(true)
    try {
      const res = await saveMarks(examId, entries)
      toast.success(`Marks saved`, {
        description: `${res.saved} entered · ${res.removed} cleared · class average ${
          res.stats.average ?? "—"
        }%`,
      })
      refetch()
      onSaved?.()
    } catch (err) {
      toast.error("Could not save marks", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!examId || !roster) return
    const missing = roster.entries.length - liveStats.entered
    const confirmed = window.confirm(
      missing > 0
        ? `Publish results? ${missing} student(s) have no marks and will not receive a result.`
        : "Publish results? Marks become read-only for teachers.",
    )
    if (!confirmed) return

    setPublishing(true)
    try {
      await updateStatus(examId, "PUBLISHED")
      toast.success("Results published", { description: "Learners and parents can now see them." })
      refetch()
      onSaved?.()
    } catch (err) {
      toast.error("Could not publish", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setPublishing(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="flex items-center gap-2 py-8 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </CardContent>
      </Card>
    )
  }

  if (!roster) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <Users className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Choose an exam to enter marks.</p>
        </CardContent>
      </Card>
    )
  }

  const readOnly = !roster.canEdit

  return (
    <div className="space-y-4">
      {/* header */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div>
            <CardTitle className="text-base">{roster.exam.name}</CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {roster.exam.className}
              {roster.exam.sectionName ? `-${roster.exam.sectionName}` : ""} ·{" "}
              {roster.exam.subjectName} · {formatDate(roster.exam.examDate)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              Total {roster.exam.totalMarks} · Pass {roster.exam.passingMarks}
            </Badge>
            {readOnly && (
              <Badge className="border-0 bg-emerald-100 text-[10px] text-emerald-700">
                Published — read only
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Find student…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calculator className="h-3.5 w-3.5" />
              {liveStats.entered}/{roster.entries.length} entered
            </span>
            {liveStats.average !== null && <span>· avg {liveStats.average}%</span>}
            {liveStats.invalid > 0 && (
              <span className="text-destructive">· {liveStats.invalid} invalid</span>
            )}
          </div>

          <div className="ml-auto flex flex-wrap gap-2">
            {!readOnly && (
              <>
                <Button variant="outline" size="sm" onClick={() => fillAll(String(roster.exam.totalMarks))}>
                  <ChevronsRight className="mr-1.5 h-3.5 w-3.5" />
                  All full
                </Button>
                <Button variant="ghost" size="sm" onClick={reset} disabled={!dirty}>
                  <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                  Reset
                </Button>
                <Button size="sm" onClick={() => void handleSave()} disabled={saving || !dirty}>
                  {saving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  {saving ? "Saving…" : "Save marks"}
                </Button>
              </>
            )}
            {!readOnly && isAdmin && roster.entries.length > 0 && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void handlePublish()}
                disabled={publishing || dirty || liveStats.entered === 0}
                title={dirty ? "Save first, then publish" : undefined}
              >
                {publishing ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-3.5 w-3.5" />
                )}
                Publish
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* rows */}
      <Card>
        <CardContent className="p-0">
          {roster.entries.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center">
              <Users className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No active students are enrolled for this exam.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No student matches “{search}”.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((entry) => {
                const raw = draft[entry.studentId]?.raw ?? ""
                const value = raw.trim() === "" ? null : Number(raw)
                const invalid =
                  value !== null &&
                  (!Number.isFinite(value) || value < 0 || value > roster.exam.totalMarks)
                const percent = value === null || invalid ? null : (value / roster.exam.totalMarks) * 100
                const grade = percent === null ? null : gradeFor(percent)
                const failed = value !== null && !invalid && value < roster.exam.passingMarks

                return (
                  <div
                    key={entry.studentId}
                    className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="w-8 shrink-0 text-xs text-muted-foreground">
                        {entry.rollNo ?? "—"}
                      </span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                          {entry.name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0]?.toUpperCase())
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">{entry.admissionNo}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={roster.exam.totalMarks}
                          step="0.5"
                          placeholder="—"
                          value={raw}
                          disabled={readOnly}
                          onChange={(e) => setMarks(entry.studentId, e.target.value)}
                          className={cn(
                            "w-24 pr-12 text-right tabular-nums",
                            invalid && "border-destructive focus-visible:ring-destructive",
                          )}
                        />
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          / {roster.exam.totalMarks}
                        </span>
                      </div>

                      <div className="w-16 text-center">
                        {grade ? (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px]",
                              failed
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-emerald-200 bg-emerald-50 text-emerald-700",
                            )}
                          >
                            {grade}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>

                      <Input
                        placeholder="Remarks"
                        value={draft[entry.studentId]?.remarks ?? ""}
                        disabled={readOnly}
                        onChange={(e) => setRemarks(entry.studentId, e.target.value)}
                        className="w-full text-xs sm:w-40"
                      />

                      {percent !== null && (
                        <span className="w-12 text-right text-xs text-muted-foreground">
                          {Math.round(percent)}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!readOnly && (
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Leave a mark empty to record the student as absent. Grades follow the standard scale
          (A+ ≥ 90, A ≥ 80, B ≥ 70, C ≥ 60, D ≥ 50, E ≥ 40).
        </p>
      )}

      {dirty && (
        <p className="text-xs text-amber-600">Unsaved changes — remember to save before leaving.</p>
      )}
    </div>
  )
}

/** Compact summary card used above the marks table. */
export function MarksSummary({ roster }: { roster: MarksRoster }) {
  const items = [
    { label: "Students", value: roster.stats.total },
    { label: "Entered", value: roster.stats.entered },
    { label: "Absent", value: roster.stats.absent },
    { label: "Average", value: roster.stats.average === null ? "—" : `${roster.stats.average}%` },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-bold">{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/** Small green check used in tables. */
export function SavedTick() {
  return <Check className="h-3.5 w-3.5 text-emerald-600" />
}
