"use client"

import { useEffect, useState } from "react"
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
import { Loader2 } from "lucide-react"
import {
  dayLabel,
  useSlotActions,
  useTimetableOptions,
  type CreateSlotInput,
  type DayOfWeek,
  type SlotRow,
} from "@/lib/hooks/use-timetable"

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"]
const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

export interface SlotDraft {
  slot?: SlotRow
  classId?: string
  sectionId?: string
  day?: string
  startTime?: string
  endTime?: string
}

interface Props {
  open: boolean
  draft: SlotDraft | null
  onClose: () => void
  /** Fired after a successful create/update so the parent can refetch. */
  onSaved?: () => void
}

const addMinutes = (time: string, minutes: number) => {
  const [h, m] = time.split(":").map(Number)
  const total = (h ?? 0) * 60 + (m ?? 0) + minutes
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`
}

export function SlotEditorModal({ open, draft, onClose, onSaved }: Props) {
  const { options } = useTimetableOptions(open)
  const { createSlot, updateSlot, isPending: busy } = useSlotActions(onSaved)

  const existing = draft?.slot
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [subjectId, setSubjectId] = useState("")
  const [teacherId, setTeacherId] = useState("")
  const [day, setDay] = useState<DayOfWeek>("MONDAY")
  const [startTime, setStartTime] = useState("08:00")
  const [endTime, setEndTime] = useState("08:45")
  const [roomNo, setRoomNo] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setError(null)
    setClassId(existing?.classId ?? draft?.classId ?? "")
    setSectionId(existing?.sectionId ?? draft?.sectionId ?? "")
    setSubjectId(existing?.subjectId ?? "")
    setTeacherId(existing?.teacherId ?? "")
    setDay((existing?.dayOfWeek ?? (draft?.day as DayOfWeek) ?? "MONDAY") as DayOfWeek)
    setStartTime(existing?.startTime ?? draft?.startTime ?? "08:00")
    setEndTime(existing?.endTime ?? draft?.endTime ?? addMinutes(draft?.startTime ?? "08:00", 45))
    setRoomNo(existing?.roomNo ?? "")
  }, [open, draft, existing])

  const sections = options?.classes.find((c) => c.id === classId)?.sections ?? []
  const subjects = options?.subjects.filter((s) => s.classId === classId) ?? []

  const handleClass = (next: string) => {
    setClassId(next)
    const nextSections = options?.classes.find((c) => c.id === next)?.sections ?? []
    setSectionId(nextSections[0]?.id ?? "")
    setSubjectId("")
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!classId) return setError("Choose a class")
    if (!subjectId) return setError("Choose a subject")

    const payload: CreateSlotInput = {
      classId,
      sectionId: sectionId || null,
      subjectId,
      teacherId: teacherId || null,
      dayOfWeek: day,
      startTime,
      endTime,
      roomNo: roomNo.trim() || null,
    }

    try {
      if (existing) await updateSlot({ id: existing.id, ...payload })
      else await createSlot(payload)
      onClose()
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
        "Could not save this slot"
      setError(message)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit class slot" : "Add class to timetable"}</DialogTitle>
          <DialogDescription>
            {existing
              ? "Changes apply immediately for everyone who sees this timetable."
              : "Pick the class, subject and time. Conflicts with other classes or a busy teacher are rejected."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="slot-class">Class</Label>
              <select
                id="slot-class"
                className={selectClass}
                value={classId}
                onChange={(e) => handleClass(e.target.value)}
              >
                <option value="">Select class</option>
                {options?.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slot-section">Section</Label>
              <select
                id="slot-section"
                className={selectClass}
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
              >
                <option value="">Whole class</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slot-subject">Subject</Label>
              <select
                id="slot-subject"
                className={selectClass}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
              >
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slot-teacher">Teacher</Label>
              <select
                id="slot-teacher"
                className={selectClass}
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
              >
                <option value="">Unassigned</option>
                {options?.teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slot-day">Day</Label>
              <select
                id="slot-day"
                className={selectClass}
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {dayLabel(d)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slot-room">Room</Label>
              <Input
                id="slot-room"
                value={roomNo}
                placeholder="e.g. 10A"
                onChange={(e) => setRoomNo(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slot-start">Start</Label>
              <Input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slot-end">End</Label>
              <Input id="slot-end" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {existing ? "Save changes" : "Add slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
