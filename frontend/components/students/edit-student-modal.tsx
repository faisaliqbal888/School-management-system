"use client"

import { useEffect, useState } from "react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { useApiQuery } from "@/lib/hooks/use-api-query"
import { studentEditSchema, type StudentEditValues } from "@/lib/validation/schemas"
import {
  useStudent,
  useUpdateStudent,
  type StudentStatus,
} from "@/lib/hooks/use-students"

interface ClassRow {
  id: string
  name: string
}
interface SectionRow {
  id: string
  name: string
}

interface EditStudentModalProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

const STATUSES: { value: StudentStatus; label: string }[] = [
  { value: "ACTIVE", label: "Active" },
  { value: "PENDING", label: "Pending" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "GRADUATED", label: "Graduated" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "WITHDRAWN", label: "Withdrawn" },
]

export function EditStudentModal({
  studentId,
  open,
  onOpenChange,
  onUpdated,
}: EditStudentModalProps) {
  const { student, isLoading, error: loadError, refetch } = useStudent(open ? studentId : null)
  const updateStudent = useUpdateStudent()

  const classesQ = useApiQuery<ClassRow[]>("/classes?limit=100", { enabled: open })
  const [classId, setClassId] = useState("")
  const sectionsQ = useApiQuery<SectionRow[]>(classId ? `/classes/${classId}/sections` : null, {
    enabled: open && !!classId,
  })

  const form = useForm<StudentEditValues>({
    resolver: zodResolver(studentEditSchema),
    defaultValues: {
      name: "",
      phone: "",
      dateOfBirth: "",
      gender: "",
      bloodGroup: "",
      address: "",
      city: "",
      status: "ACTIVE",
      sectionId: "",
      rollNo: "",
      guardianName: "",
      guardianRelation: "",
      guardianPhone: "",
      guardianEmail: "",
      guardianCnic: "",
      guardianOccupation: "",
    },
  })
  const values = form.watch()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // hydrate the form once the record arrives
  useEffect(() => {
    if (!student) return
    const primary = student.guardians.find((g) => g.isPrimary) ?? student.guardians[0]
    form.reset({
      name: student.name,
      phone: student.phone ?? "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
      gender: student.gender ?? "",
      bloodGroup: student.bloodGroup ?? "",
      address: student.address ?? "",
      city: student.city ?? "",
      status: student.status,
      sectionId: student.section?.id ?? "",
      rollNo: student.rollNo ?? "",
      guardianName: primary?.name ?? "",
      guardianRelation: primary?.relation ?? "",
      guardianPhone: primary?.phone ?? "",
      guardianEmail: primary?.email ?? "",
      guardianCnic: primary?.cnic ?? "",
      guardianOccupation: primary?.occupation ?? "",
    })
    setClassId(student.class?.id ?? "")
    setError("")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student])

  const set = <K extends keyof StudentEditValues>(key: K, value: StudentEditValues[K]) =>
    form.setValue(key, value as never, { shouldDirty: true })

  const handleSave = form.handleSubmit(async (data) => {
    if (!student) return

    setError("")
    setSaving(true)
    try {
      const guardian =
        data.guardianName.trim() && data.guardianRelation.trim() && data.guardianPhone.trim()
          ? {
              name: data.guardianName.trim(),
              relation: data.guardianRelation.trim(),
              phone: data.guardianPhone.trim(),
              email: data.guardianEmail.trim() || null,
              cnic: data.guardianCnic.trim() || null,
              occupation: data.guardianOccupation.trim() || null,
            }
          : undefined

      await updateStudent(student.id, {
        name: data.name.trim(),
        phone: data.phone?.trim() || null,
        dateOfBirth: data.dateOfBirth || undefined,
        gender: (data.gender || undefined) as "MALE" | "FEMALE" | "OTHER" | undefined,
        bloodGroup: data.bloodGroup.trim() || null,
        address: data.address.trim() || null,
        city: data.city.trim() || null,
        status: data.status,
        ...(data.sectionId && data.sectionId !== student.section?.id ? { sectionId: data.sectionId } : {}),
        rollNo: data.rollNo.trim() || null,
        ...(guardian ? { guardian } : {}),
      })

      refetch()
      onUpdated?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes")
    } finally {
      setSaving(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            {student
              ? `${student.name} · ${student.admissionNo}`
              : "Update the enrolment record"}
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
          <form id="edit-student-form" onSubmit={handleSave} noValidate className="space-y-6 py-2">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Personal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" required error={form.formState.errors.name?.message}>
                  <Input value={values.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Status" error={form.formState.errors.status?.message}>
                  <Select
                    value={values.status}
                    onValueChange={(v) => set("status", v as StudentStatus)}
                  >
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
                <Field label="Date of Birth" error={form.formState.errors.dateOfBirth?.message}>
                  <Input
                    type="date"
                    value={values.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                  />
                </Field>
                <Field label="Gender" error={form.formState.errors.gender?.message}>
                  <Select
                    value={values.gender}
                    onValueChange={(v) => set("gender", v as typeof values.gender)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Phone">
                  <Input value={values.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label="Blood Group" error={form.formState.errors.bloodGroup?.message}>
                  <Input
                    value={values.bloodGroup}
                    onChange={(e) => set("bloodGroup", e.target.value)}
                  />
                </Field>
                <Field label="Address" className="md:col-span-2" error={form.formState.errors.address?.message}>
                  <Input value={values.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <Field label="City" error={form.formState.errors.city?.message}>
                  <Input value={values.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Academic</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Class">
                  <Select
                    value={classId}
                    onValueChange={(v) => {
                      setClassId(v)
                      set("sectionId", "")
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      {(classesQ.data ?? []).map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Section">
                  <Select
                    value={values.sectionId}
                    onValueChange={(v) => set("sectionId", v)}
                    disabled={!classId}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={sectionsQ.isLoading ? "Loading…" : "Select section"}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {(sectionsQ.data ?? []).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          Section {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Roll Number" error={form.formState.errors.rollNo?.message}>
                  <Input value={values.rollNo} onChange={(e) => set("rollNo", e.target.value)} />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Changing the section transfers the current enrolment and creates a new one.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Primary Guardian</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name" error={form.formState.errors.guardianName?.message}>
                  <Input
                    value={values.guardianName}
                    onChange={(e) => set("guardianName", e.target.value)}
                  />
                </Field>
                <Field label="Relation" error={form.formState.errors.guardianRelation?.message}>
                  <Input
                    value={values.guardianRelation}
                    onChange={(e) => set("guardianRelation", e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={values.guardianPhone}
                    onChange={(e) => set("guardianPhone", e.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={values.guardianEmail}
                    onChange={(e) => set("guardianEmail", e.target.value)}
                  />
                </Field>
                <Field label="CNIC" error={form.formState.errors.guardianCnic?.message}>
                  <Input
                    value={values.guardianCnic}
                    onChange={(e) => set("guardianCnic", e.target.value)}
                  />
                </Field>
                <Field label="Occupation" error={form.formState.errors.guardianOccupation?.message}>
                  <Input
                    value={values.guardianOccupation}
                    onChange={(e) => set("guardianOccupation", e.target.value)}
                  />
                </Field>
              </div>
            </section>
          </form>
        )}

        {(error || loadError) && (
          <Alert variant="destructive">
            <AlertDescription>{error || loadError}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-student-form" disabled={saving || isLoading || !student}>
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
  error,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
