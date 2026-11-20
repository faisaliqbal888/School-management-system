"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { CalendarPlus, Loader2 } from "lucide-react"
import { useApiQuery } from "@/lib/hooks/use-api-query"
import { EXAM_TYPE_LABEL, useCreateExam, type ExamType } from "@/lib/hooks/use-exams"

interface ScheduleExamModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  /** A class to pre-select (e.g. from a filter). */
  presetClassId?: string | null
}

interface ClassRow {
  id: string
  name: string
  level: number
}
interface SubjectRow {
  id: string
  name: string
  code: string | null
  classId: string
}
interface SectionRow {
  id: string
  name: string
}

const TYPES: ExamType[] = ["QUIZ", "UNIT_TEST", "MIDTERM", "FINAL", "PRACTICAL", "PROJECT"]

export function ScheduleExamModal({
  open,
  onOpenChange,
  onCreated,
  presetClassId,
}: ScheduleExamModalProps) {
  const createExam = useCreateExam()

  const classesQ = useApiQuery<ClassRow[]>("/classes?limit=100", { enabled: open })
  const subjectsQ = useApiQuery<SubjectRow[]>("/subjects?limit=100", { enabled: open })

  const [name, setName] = useState("")
  const [type, setType] = useState<ExamType>("MIDTERM")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [examDate, setExamDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime] = useState("09:00")
  const [durationMin, setDurationMin] = useState("120")
  const [totalMarks, setTotalMarks] = useState("100")
  const [passingMarks, setPassingMarks] = useState("40")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const sectionsQ = useApiQuery<SectionRow[]>(classId ? `/classes/${classId}/sections` : null, {
    enabled: open && !!classId,
  })

  useEffect(() => {
    if (!open) return
    setName("")
    setType("MIDTERM")
    setClassId(presetClassId ?? "")
    setSectionId("")
    setSubjectId("")
    setExamDate(new Date().toISOString().slice(0, 10))
    setStartTime("09:00")
    setDurationMin("120")
    setTotalMarks("100")
    setPassingMarks("40")
    setError("")
  }, [open, presetClassId])

  // subjects filtered by the chosen class
  const subjects = useMemo(
    () => (subjectsQ.data ?? []).filter((s) => !classId || s.classId === classId),
    [subjectsQ.data, classId],
  )

  const handleSubmit = async () => {
    if (!name.trim()) return setError("Please enter an exam name")
    if (!classId) return setError("Please choose a class")
    if (!subjectId) return setError("Please choose a subject")
    if (!examDate) return setError("Please choose an exam date")
    if (Number(passingMarks) > Number(totalMarks)) {
      return setError("Passing marks cannot exceed total marks")
    }

    setError("")
    setSaving(true)
    try {
      await createExam({
        name: name.trim(),
        type,
        examDate,
        startTime: startTime || null,
        durationMin: Number(durationMin) || 120,
        totalMarks: Number(totalMarks) || 100,
        passingMarks: Number(passingMarks) || 40,
        classId,
        sectionId: sectionId || null,
        subjectId,
      })
      toast.success("Exam scheduled", { description: `${name} · ${examDate}` })
      onCreated?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule the exam")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CalendarPlus className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Schedule Exam</DialogTitle>
              <DialogDescription className="text-xs">
                Marks entry opens as soon as the exam is created
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Exam name</Label>
            <Input
              placeholder="e.g. Midterm 2026 — Mathematics"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as ExamType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {EXAM_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={classId}
                onValueChange={(v) => {
                  setClassId(v)
                  setSectionId("")
                  setSubjectId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a class" />
                </SelectTrigger>
                <SelectContent>
                  {(classesQ.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section (optional)</Label>
              <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                <SelectTrigger>
                  <SelectValue placeholder={classId ? "All sections" : "Choose a class first"} />
                </SelectTrigger>
                <SelectContent>
                  {(sectionsQ.data ?? []).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      Section {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId} disabled={!classId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !classId
                      ? "Choose a class first"
                      : subjectsQ.isLoading
                        ? "Loading…"
                        : "Choose a subject"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                    {s.code ? ` (${s.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Start time</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Duration (min)</Label>
              <Input
                type="number"
                min={10}
                step={5}
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Total marks</Label>
              <Input
                type="number"
                min={1}
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Passing marks</Label>
            <Input
              type="number"
              min={0}
              value={passingMarks}
              onChange={(e) => setPassingMarks(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Scheduling…" : "Schedule Exam"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
