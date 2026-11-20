"use client"

import { useEffect, useMemo, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  Save,
  Search,
  Users,
  XCircle,
} from "lucide-react"
import {
  todayIso,
  useAttendanceSections,
  useMarkAttendance,
  useRoster,
  type AttendanceStatus,
} from "@/lib/hooks/use-attendance"
import { cn } from "@/lib/utils"

const STATUS_META: {
  value: AttendanceStatus
  label: string
  icon: React.ElementType
  active: string
  idle: string
}[] = [
  {
    value: "PRESENT",
    label: "Present",
    icon: CheckCircle2,
    active: "bg-emerald-500 text-white hover:bg-emerald-600",
    idle: "text-emerald-700 hover:bg-emerald-50",
  },
  {
    value: "LATE",
    label: "Late",
    icon: Clock,
    active: "bg-amber-500 text-white hover:bg-amber-600",
    idle: "text-amber-700 hover:bg-amber-50",
  },
  {
    value: "ABSENT",
    label: "Absent",
    icon: XCircle,
    active: "bg-red-500 text-white hover:bg-red-600",
    idle: "text-red-700 hover:bg-red-50",
  },
  {
    value: "EXCUSED",
    label: "Excused",
    icon: AlertCircle,
    active: "bg-blue-500 text-white hover:bg-blue-600",
    idle: "text-blue-700 hover:bg-blue-50",
  },
]

interface Draft {
  [studentId: string]: { status: AttendanceStatus | null; remarks: string | null }
}

export function AttendanceMarking() {
  const { sections, isLoading: sectionsLoading, error: sectionsError } = useAttendanceSections()
  const [sectionId, setSectionId] = useState<string>("")
  const [date, setDate] = useState(todayIso())
  const [search, setSearch] = useState("")
  const [draft, setDraft] = useState<Draft>({})
  const [saving, setSaving] = useState(false)

  const { entries, summary, isLoading, error, refetch } = useRoster(sectionId || null, date)
  const mark = useMarkAttendance()

  // first section auto-selects
  useEffect(() => {
    if (!sectionId && sections.length > 0) setSectionId(sections[0]!.id)
  }, [sections, sectionId])

  // hydrate the draft whenever the roster changes
  useEffect(() => {
    const next: Draft = {}
    for (const e of entries) next[e.studentId] = { status: e.status, remarks: e.remarks }
    setDraft(next)
  }, [entries])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return entries
    return entries.filter(
      (e) =>
        e.name.toLowerCase().includes(term) ||
        (e.rollNo ?? "").toLowerCase().includes(term) ||
        e.admissionNo.toLowerCase().includes(term),
    )
  }, [entries, search])

  const dirty = useMemo(
    () => entries.some((e) => (draft[e.studentId]?.status ?? null) !== e.status),
    [entries, draft],
  )

  const counts = useMemo(() => {
    const acc = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0, HOLIDAY: 0, unmarked: 0 }
    for (const e of entries) {
      const status = draft[e.studentId]?.status
      if (!status) acc.unmarked += 1
      else acc[status] += 1
    }
    return acc
  }, [entries, draft])

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setDraft((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status === status ? null : status,
        remarks: prev[studentId]?.remarks ?? null,
      },
    }))
  }

  const markAll = (status: AttendanceStatus) => {
    const next: Draft = {}
    for (const e of entries) next[e.studentId] = { status, remarks: draft[e.studentId]?.remarks ?? null }
    setDraft(next)
  }

  const reset = () => {
    const next: Draft = {}
    for (const e of entries) next[e.studentId] = { status: e.status, remarks: e.remarks }
    setDraft(next)
  }

  const handleSave = async () => {
    if (!sectionId) return
    const payload = entries
      .filter((e) => draft[e.studentId]?.status)
      .map((e) => ({
        studentId: e.studentId,
        status: draft[e.studentId]!.status as AttendanceStatus,
        remarks: draft[e.studentId]!.remarks ?? null,
      }))

    if (payload.length === 0) {
      toast.error("Nothing to save", { description: "Mark at least one student first." })
      return
    }

    setSaving(true)
    try {
      const res = await mark({ sectionId, date, entries: payload })
      toast.success(`Attendance saved for ${res.saved} student${res.saved === 1 ? "" : "s"}`, {
        description: Object.entries(res.summary)
          .map(([k, v]) => `${v} ${k.toLowerCase()}`)
          .join(" · "),
      })
      refetch()
    } catch (err) {
      toast.error("Could not save attendance", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedSection = sections.find((s) => s.id === sectionId)

  if (sectionsError) {
    return <ErrorCard message={sectionsError} />
  }

  return (
    <div className="space-y-5">
      {/* controls */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Section</label>
            <Select value={sectionId} onValueChange={setSectionId} disabled={sectionsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={sectionsLoading ? "Loading…" : "Choose a section"} />
              </SelectTrigger>
              <SelectContent>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.className} — {s.name} ({s.studentCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Date</label>
            <Input
              type="date"
              value={date}
              max={todayIso()}
              onChange={(e) => setDate(e.target.value)}
              className="w-full md:w-44"
            />
          </div>

          <div className="relative flex-1 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Find student</label>
            <Search className="pointer-events-none absolute left-3 top-[2.1rem] h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Name or roll no…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* summary strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <MiniStat label="Students" value={entries.length} icon={Users} tone="slate" />
        <MiniStat label="Present" value={counts.PRESENT} icon={CheckCircle2} tone="emerald" />
        <MiniStat label="Late" value={counts.LATE} icon={Clock} tone="amber" />
        <MiniStat label="Absent" value={counts.ABSENT} icon={XCircle} tone="red" />
        <MiniStat label="Unmarked" value={counts.unmarked} icon={AlertCircle} tone="blue" />
      </div>

      {/* roster */}
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {selectedSection
                ? `${selectedSection.className} — Section ${selectedSection.name}`
                : "Select a section"}
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {date} {summary && summary.total > 0 ? `· ${summary.total} enrolled` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => markAll("PRESENT")} disabled={isLoading}>
              <Check className="mr-1.5 h-4 w-4" />
              All present
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              disabled={isLoading || !dirty}
              title="Discard changes"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={() => void handleSave()} disabled={saving || isLoading || !sectionId}>
              {saving ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-4 w-4" />
              )}
              {saving ? "Saving…" : "Save attendance"}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <p className="p-6 text-center text-sm text-destructive">{error}</p>
          ) : !sectionId ? (
            <EmptyRow icon={Users} message="Choose a section to load its roster." />
          ) : entries.length === 0 ? (
            <EmptyRow icon={Users} message="No active students in this section." />
          ) : filtered.length === 0 ? (
            <EmptyRow icon={Search} message={`No student matches “${search}”.`} />
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((entry) => {
                const current = draft[entry.studentId]?.status ?? null
                return (
                  <div
                    key={entry.studentId}
                    className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={entry.avatarUrl ?? undefined} alt={entry.name} />
                        <AvatarFallback className="bg-primary/10 text-xs text-primary">
                          {entry.name
                            .split(" ")
                            .slice(0, 2)
                            .map((n) => n[0]?.toUpperCase())
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{entry.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.rollNo ? `Roll ${entry.rollNo} · ` : ""}
                          {entry.admissionNo}
                        </p>
                      </div>
                      {entry.status && (
                        <Badge variant="outline" className="ml-1 hidden text-[10px] sm:inline-flex">
                          saved: {entry.status.toLowerCase()}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:justify-end">
                      {STATUS_META.map((s) => {
                        const active = current === s.value
                        return (
                          <button
                            key={s.value}
                            type="button"
                            onClick={() => setStatus(entry.studentId, s.value)}
                            className={cn(
                              "flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium transition-colors",
                              active ? s.active : `bg-background ${s.idle}`,
                            )}
                          >
                            <s.icon className="h-3.5 w-3.5" />
                            {s.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {dirty && (
        <p className="text-xs text-amber-600">
          You have unsaved changes. Save before switching date or section.
        </p>
      )}
    </div>
  )
}

function MiniStat({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ElementType
  tone: "slate" | "emerald" | "amber" | "red" | "blue"
}) {
  const tones = {
    slate: "bg-slate-50 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    blue: "bg-blue-50 text-blue-600",
  }
  return (
    <Card>
      <CardContent className="flex items-center gap-2.5 p-3">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", tones[tone])}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="text-lg font-bold leading-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyRow({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

function ErrorCard({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="flex items-center gap-2 py-8 text-sm text-destructive">
        <AlertCircle className="h-4 w-4" />
        {message}
      </CardContent>
    </Card>
  )
}
