"use client"

import { useEffect, useMemo, useState } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { toast } from "sonner"
import { CalendarPlus, Loader2 } from "lucide-react"
import { useApiQuery } from "@/lib/hooks/use-api-query"
import {
  EXAM_TYPE_LABEL,
  useCreateExam,
  type ExamType,
} from "@/lib/hooks/use-exams"
import { EXAM_TYPES, examSchema, type ExamValues } from "@/lib/validation/schemas"

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

const TYPES: ExamType[] = [...EXAM_TYPES]

const emptyValues = (presetClassId?: string | null): ExamValues => ({
  name: "",
  type: "MIDTERM",
  classId: presetClassId ?? "",
  sectionId: "",
  subjectId: "",
  examDate: new Date().toISOString().slice(0, 10),
  startTime: "09:00",
  durationMin: 120,
  totalMarks: 100,
  passingMarks: 40,
})

export function ScheduleExamModal({
  open,
  onOpenChange,
  onCreated,
  presetClassId,
}: ScheduleExamModalProps) {
  const createExam = useCreateExam()

  const classesQ = useApiQuery<ClassRow[]>("/classes?limit=100", { enabled: open })
  const subjectsQ = useApiQuery<SubjectRow[]>("/subjects?limit=100", { enabled: open })

  const form = useForm<ExamValues>({
    resolver: zodResolver(examSchema),
    defaultValues: emptyValues(presetClassId),
  })

  const className = form.watch("classId")
  const [saving, setSaving] = useState(false)

  const sectionsQ = useApiQuery<SectionRow[]>(className ? `/classes/${className}/sections` : null, {
    enabled: open && !!className,
  })

  // subjects filtered by the chosen class
  const subjects = useMemo(
    () => (subjectsQ.data ?? []).filter((s) => !className || s.classId === className),
    [subjectsQ.data, className],
  )

  useEffect(() => {
    if (open) form.reset(emptyValues(presetClassId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetClassId])

  const submit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      await createExam({
        name: values.name,
        type: values.type,
        examDate: values.examDate,
        startTime: values.startTime || null,
        durationMin: values.durationMin || 120,
        totalMarks: values.totalMarks || 100,
        passingMarks: values.passingMarks || 0,
        classId: values.classId,
        sectionId: values.sectionId || null,
        subjectId: values.subjectId,
      })
      toast.success("Exam scheduled", { description: `${values.name} · ${values.examDate}` })
      onCreated?.()
      onOpenChange(false)
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Could not schedule the exam",
      })
    } finally {
      setSaving(false)
    }
  })

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

        <form onSubmit={submit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <Label>Exam name</Label>
                <Input placeholder="e.g. Midterm 2026 — Mathematics" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <Label>Type</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="examDate"
              render={({ field }) => (
                <FormItem>
                  <Label>Date</Label>
                  <Input type="date" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="classId"
              render={({ field }) => (
                <FormItem>
                  <Label>Class</Label>
                  <Select
                    value={field.value}
                    onValueChange={(next) => {
                      field.onChange(next)
                      form.setValue("sectionId", "")
                      form.setValue("subjectId", "")
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sectionId"
              render={({ field }) => (
                <FormItem>
                  <Label>Section (optional)</Label>
                  <Select value={field.value} onValueChange={field.onChange} disabled={!className}>
                    <SelectTrigger>
                      <SelectValue placeholder={className ? "All sections" : "Choose a class first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {(sectionsQ.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          Section {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="subjectId"
            render={({ field }) => (
              <FormItem>
                <Label>Subject</Label>
                <Select value={field.value} onValueChange={field.onChange} disabled={!className}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !className
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
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-3">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <Label>Start time</Label>
                  <Input type="time" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="durationMin"
              render={({ field }) => (
                <FormItem>
                  <Label>Duration (min)</Label>
                  <Input type="number" min={5} step={5} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalMarks"
              render={({ field }) => (
                <FormItem>
                  <Label>Total marks</Label>
                  <Input type="number" min={1} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="passingMarks"
            render={({ field }) => (
              <FormItem>
                <Label>Passing marks</Label>
                <Input type="number" min={0} {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <Alert variant="destructive">
              <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
            </Alert>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saving ? "Scheduling…" : "Schedule Exam"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
