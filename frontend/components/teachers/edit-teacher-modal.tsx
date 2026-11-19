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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import {
  useTeacher,
  useUpdateTeacher,
  useTeacherOptions,
  type EmploymentType,
  type StaffStatus,
} from "@/lib/hooks/use-teachers"

interface EditTeacherModalProps {
  teacherId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

const STATUSES: { value: StaffStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_LEAVE", label: "On leave" },
  { value: "RESIGNED", label: "Resigned" },
  { value: "TERMINATED", label: "Terminated" },
]

export function EditTeacherModal({ teacherId, open, onOpenChange, onUpdated }: EditTeacherModalProps) {
  const { teacher, isLoading, error: loadError, refetch } = useTeacher(open ? teacherId : null)
  const { options } = useTeacherOptions(open)
  const updateTeacher = useUpdateTeacher()

  const [form, setForm] = useState({
    name: "",
    phone: "",
    department: "",
    designation: "",
    qualification: "",
    specialization: "",
    joiningDate: "",
    employmentType: "PERMANENT" as EmploymentType,
    baseSalary: "",
    status: "ACTIVE" as StaffStatus,
    subjectIds: [] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!teacher) return
    setForm({
      name: teacher.name,
      phone: teacher.phone ?? "",
      department: teacher.department,
      designation: teacher.designation,
      qualification: teacher.qualification ?? "",
      specialization: teacher.specialization ?? "",
      joiningDate: teacher.joiningDate.slice(0, 10),
      employmentType: teacher.employmentType,
      baseSalary: String(teacher.baseSalary),
      status: teacher.status,
      // map the subject names back to ids using the options payload
      subjectIds: (options?.subjects ?? [])
        .filter((s) => teacher.subjects.includes(s.name))
        .map((s) => s.id),
    })
    setError("")
  }, [teacher, options])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleSubject = (id: string) => {
    setForm((prev) => ({
      ...prev,
      subjectIds: prev.subjectIds.includes(id)
        ? prev.subjectIds.filter((s) => s !== id)
        : [...prev.subjectIds, id],
    }))
  }

  const handleSave = async () => {
    if (!teacher) return
    if (form.name.trim().length < 2) {
      setError("Please enter the teacher's full name")
      return
    }
    if (!form.baseSalary || Number(form.baseSalary) < 0) {
      setError("Enter a valid base salary")
      return
    }

    setError("")
    setSaving(true)
    try {
      await updateTeacher(teacher.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        department: form.department.trim(),
        designation: form.designation.trim(),
        qualification: form.qualification.trim() || null,
        specialization: form.specialization.trim() || null,
        joiningDate: form.joiningDate || undefined,
        employmentType: form.employmentType,
        baseSalary: Number(form.baseSalary),
        status: form.status,
        subjectIds: form.subjectIds,
      })
      refetch()
      onUpdated?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Teacher</DialogTitle>
          <DialogDescription>
            {teacher ? `${teacher.name} · ${teacher.employeeNo}` : "Update the staff record"}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="grid gap-4 py-2 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6 py-2">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name" required>
                <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => set("status", v as StaffStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Qualification">
                <Input
                  value={form.qualification}
                  onChange={(e) => set("qualification", e.target.value)}
                />
              </Field>
              <Field label="Department" required>
                <Input
                  list="edit-department-options"
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                />
                <datalist id="edit-department-options">
                  {(options?.departments ?? []).map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <Field label="Designation" required>
                <Input
                  list="edit-designation-options"
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                />
                <datalist id="edit-designation-options">
                  {(options?.designations ?? []).map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <Field label="Specialization" className="md:col-span-2">
                <Input
                  value={form.specialization}
                  onChange={(e) => set("specialization", e.target.value)}
                />
              </Field>
              <Field label="Joining Date">
                <Input
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => set("joiningDate", e.target.value)}
                />
              </Field>
              <Field label="Employment Type">
                <Select
                  value={form.employmentType}
                  onValueChange={(v) => set("employmentType", v as EmploymentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERMANENT">Permanent</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="VISITING">Visiting</SelectItem>
                    <SelectItem value="PART_TIME">Part-time</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Base Salary (PKR / month)" required>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={form.baseSalary}
                  onChange={(e) => set("baseSalary", e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-2">
              <Label>Subjects taught</Label>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-3">
                {(options?.subjects ?? []).map((s) => {
                  const active = form.subjectIds.includes(s.id)
                  return (
                    <button key={s.id} type="button" onClick={() => toggleSubject(s.id)}>
                      <Badge
                        variant={active ? "default" : "outline"}
                        className="cursor-pointer text-xs font-normal"
                      >
                        {s.name}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            </div>

            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              Setting the status to Resigned or Terminated also disables the staff login.
            </p>
          </div>
        )}

        {(error || loadError) && (
          <Alert variant="destructive">
            <AlertDescription>{error || loadError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || isLoading || !teacher}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )
}
