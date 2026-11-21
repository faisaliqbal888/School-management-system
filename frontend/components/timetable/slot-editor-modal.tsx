"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import {
  dayLabel,
  useSlotActions,
  useTimetableOptions,
  type CreateSlotInput,
  type DayOfWeek,
  type SlotRow,
} from "@/lib/hooks/use-timetable"
import { slotSchema, type SlotValues } from "@/lib/validation/schemas"

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

function valuesFrom(draft: SlotDraft | null): SlotValues {
  const existing = draft?.slot
  const start = existing?.startTime ?? draft?.startTime ?? "08:00"
  return {
    classId: existing?.classId ?? draft?.classId ?? "",
    sectionId: existing?.sectionId ?? draft?.sectionId ?? "",
    subjectId: existing?.subjectId ?? "",
    teacherId: existing?.teacherId ?? "",
    dayOfWeek: (existing?.dayOfWeek ?? (draft?.day as DayOfWeek) ?? "MONDAY") as DayOfWeek,
    startTime: start,
    endTime: existing?.endTime ?? draft?.endTime ?? addMinutes(start, 45),
    roomNo: existing?.roomNo ?? "",
  }
}

export function SlotEditorModal({ open, draft, onClose, onSaved }: Props) {
  const { options } = useTimetableOptions(open)
  const { createSlot, updateSlot, isPending: busy } = useSlotActions(onSaved)

  const existing = draft?.slot

  const form = useForm<SlotValues>({
    resolver: zodResolver(slotSchema),
    defaultValues: valuesFrom(draft),
  })

  const classId = form.watch("classId")
  const sections = options?.classes.find((c) => c.id === classId)?.sections ?? []
  const subjects = options?.subjects.filter((s) => s.classId === classId) ?? []

  useEffect(() => {
    if (open) form.reset(valuesFrom(draft))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft])

  const handleClass = (next: string) => {
    form.setValue("classId", next)
    const nextSections = options?.classes.find((c) => c.id === next)?.sections ?? []
    form.setValue("sectionId", nextSections[0]?.id ?? "")
    form.setValue("subjectId", "")
  }

  const submit = form.handleSubmit(async (values) => {
    const payload: CreateSlotInput = {
      classId: values.classId,
      sectionId: values.sectionId || null,
      subjectId: values.subjectId,
      teacherId: values.teacherId || null,
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
      roomNo: values.roomNo.trim() || null,
    }

    try {
      if (existing) await updateSlot({ id: existing.id, ...payload })
      else await createSlot(payload)
      onClose()
    } catch (err) {
      form.setError("root", {
        message:
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
            ?.message ?? "Could not save this slot",
      })
    }
  })

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

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <Label>Class</Label>
                  <select className={selectClass} {...field} onChange={(e) => handleClass(e.target.value)}>
                    <option value="">Select class</option>
                    {options?.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <Label>Section</Label>
                  <select className={selectClass} {...field}>
                    <option value="">Whole class</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <Label>Subject</Label>
                  <select className={selectClass} {...field}>
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <Label>Teacher</Label>
                  <select className={selectClass} {...field}>
                    <option value="">Unassigned</option>
                    {options?.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dayOfWeek"
              render={({ field }) => (
                <FormItem>
                  <Label>Day</Label>
                  <select className={selectClass} {...field}>
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {dayLabel(d)}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roomNo"
              render={({ field }) => (
                <FormItem>
                  <Label>Room</Label>
                  <Input placeholder="e.g. 10A" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <Label>Start</Label>
                  <Input type="time" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <Label>End</Label>
                  <Input type="time" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {form.formState.errors.root && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {form.formState.errors.root.message}
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
