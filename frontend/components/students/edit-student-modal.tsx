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
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { useApiQuery } from "@/lib/hooks/use-api-query"
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

  const [form, setForm] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "" as "" | "MALE" | "FEMALE" | "OTHER",
    bloodGroup: "",
    address: "",
    city: "",
    status: "ACTIVE" as StudentStatus,
    sectionId: "",
    rollNo: "",
    guardianName: "",
    guardianRelation: "",
    guardianPhone: "",
    guardianEmail: "",
    guardianCnic: "",
    guardianOccupation: "",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  // hydrate the form once the record arrives
  useEffect(() => {
    if (!student) return
    const primary = student.guardians.find((g) => g.isPrimary) ?? student.guardians[0]
    setForm({
      name: student.name,
      phone: student.phone ?? "",
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : "",
      gender: student.gender,
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
  }, [student])

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!student) return
    if (form.name.trim().length < 2) {
      setError("Please enter the student's full name")
      return
    }
    if (form.phone.trim() && form.phone.trim().length < 7) {
      setError("Phone number is too short")
      return
    }

    setError("")
    setSaving(true)
    try {
      const guardian =
        form.guardianName.trim() && form.guardianRelation.trim() && form.guardianPhone.trim()
          ? {
              name: form.guardianName.trim(),
              relation: form.guardianRelation.trim(),
              phone: form.guardianPhone.trim(),
              email: form.guardianEmail.trim() || null,
              cnic: form.guardianCnic.trim() || null,
              occupation: form.guardianOccupation.trim() || null,
            }
          : undefined

      await updateStudent(student.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender as "MALE" | "FEMALE" | "OTHER",
        bloodGroup: form.bloodGroup.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        status: form.status,
        ...(form.sectionId && form.sectionId !== student.section?.id
          ? { sectionId: form.sectionId }
          : {}),
        rollNo: form.rollNo.trim() || null,
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
  }

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
          <div className="space-y-6 py-2">
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Personal</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name" required>
                  <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Status">
                  <Select
                    value={form.status}
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
                <Field label="Date of Birth">
                  <Input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                  />
                </Field>
                <Field label="Gender">
                  <Select
                    value={form.gender}
                    onValueChange={(v) => set("gender", v as typeof form.gender)}
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
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
                </Field>
                <Field label="Blood Group">
                  <Input
                    value={form.bloodGroup}
                    onChange={(e) => set("bloodGroup", e.target.value)}
                  />
                </Field>
                <Field label="Address" className="md:col-span-2">
                  <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
                </Field>
                <Field label="City">
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
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
                    value={form.sectionId}
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
                <Field label="Roll Number">
                  <Input value={form.rollNo} onChange={(e) => set("rollNo", e.target.value)} />
                </Field>
              </div>
              <p className="text-xs text-muted-foreground">
                Changing the section transfers the current enrolment and creates a new one.
              </p>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground">Primary Guardian</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <Input
                    value={form.guardianName}
                    onChange={(e) => set("guardianName", e.target.value)}
                  />
                </Field>
                <Field label="Relation">
                  <Input
                    value={form.guardianRelation}
                    onChange={(e) => set("guardianRelation", e.target.value)}
                  />
                </Field>
                <Field label="Phone">
                  <Input
                    value={form.guardianPhone}
                    onChange={(e) => set("guardianPhone", e.target.value)}
                  />
                </Field>
                <Field label="Email">
                  <Input
                    type="email"
                    value={form.guardianEmail}
                    onChange={(e) => set("guardianEmail", e.target.value)}
                  />
                </Field>
                <Field label="CNIC">
                  <Input
                    value={form.guardianCnic}
                    onChange={(e) => set("guardianCnic", e.target.value)}
                  />
                </Field>
                <Field label="Occupation">
                  <Input
                    value={form.guardianOccupation}
                    onChange={(e) => set("guardianOccupation", e.target.value)}
                  />
                </Field>
              </div>
            </section>
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
          <Button onClick={() => void handleSave()} disabled={saving || isLoading || !student}>
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
