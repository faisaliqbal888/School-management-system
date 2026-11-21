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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Users, FileText, Loader2, Copy, Check, CheckCircle2 } from "lucide-react"
import { useApiQuery } from "@/lib/hooks/use-api-query"
import { useCreateStudent } from "@/lib/hooks/use-students"
import { studentSchema, type StudentFormValues } from "@/lib/validation/schemas"

interface ClassRow {
  id: string
  name: string
  level: number
}
interface SectionRow {
  id: string
  name: string
}

interface AddStudentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  /** Present when the modal is opened from "Edit" — currently read-only. */
  student?: { id?: string | number; name?: string }
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "" as "" | "MALE" | "FEMALE" | "OTHER",
  bloodGroup: "",
  address: "",
  city: "Lahore",
  classId: "",
  sectionId: "",
  rollNo: "",
  guardianName: "",
  guardianRelation: "Father",
  guardianPhone: "",
  guardianEmail: "",
  guardianCnic: "",
  guardianOccupation: "",
}

type FormState = typeof EMPTY_FORM

export function AddStudentModal({ open, onOpenChange, onCreated }: AddStudentModalProps) {
  const [tab, setTab] = useState("personal")
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ email: string; temporaryPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const createStudent = useCreateStudent()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: EMPTY_FORM,
  })

  const classId = form.watch("classId")

  const classesQ = useApiQuery<ClassRow[]>("/classes?limit=100", { enabled: open })
  const sectionsQ = useApiQuery<SectionRow[]>(
    classId ? `/classes/${classId}/sections` : null,
    { enabled: open && !!classId },
  )

  // reset whenever the modal opens
  useEffect(() => {
    if (open) {
      form.reset(EMPTY_FORM)
      setError("")
      setResult(null)
      setCopied(false)
      setTab("personal")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    form.setValue(key, value as never, { shouldDirty: true })

  const values = form.watch()

  /** Jump to the tab that owns the first invalid field, so the user sees the message. */
  const onInvalid = () => {
    const fields = Object.keys(form.formState.errors)
    if (fields.some((f) => f.startsWith("guardian"))) setTab("guardian")
    else if (fields.some((f) => ["classId", "sectionId", "rollNo"].includes(f))) setTab("academic")
    else setTab("personal")
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setError("")
    setSubmitting(true)
    try {
      const res = await createStudent({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: (data.phone ?? "").trim() || undefined,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender as "MALE" | "FEMALE" | "OTHER",
        bloodGroup: (data.bloodGroup ?? "").trim() || undefined,
        address: (data.address ?? "").trim() || undefined,
        city: (data.city ?? "").trim() || undefined,
        classId: data.classId || undefined,
        sectionId: data.sectionId || undefined,
        rollNo: (data.rollNo ?? "").trim() || undefined,
        guardian: {
          name: data.guardianName.trim(),
          relation: data.guardianRelation,
          phone: data.guardianPhone.trim(),
          email: (data.guardianEmail ?? "").trim() || undefined,
          cnic: (data.guardianCnic ?? "").trim() || undefined,
          occupation: (data.guardianOccupation ?? "").trim() || undefined,
        },
      })
      setResult(res.credentials)
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enrol the student")
    } finally {
      setSubmitting(false)
    }
  }, onInvalid)

  const copyCredentials = async () => {
    if (!result) return
    await navigator.clipboard.writeText(
      `Student portal login\nEmail: ${result.email}\nTemporary password: ${result.temporaryPassword}`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── success screen ─────────────────────────────────────────
  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center">Student enrolled</DialogTitle>
            <DialogDescription className="text-center">
              Share these credentials with the family. The password is shown only once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="font-mono text-sm">{result.email}</p>
            </div>
            <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground">Temporary password</p>
              <p className="font-mono text-sm">{result.temporaryPassword}</p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => void copyCredentials()} className="gap-2">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // ── form ──────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Student</DialogTitle>
          <DialogDescription>
            Fill in the details to create the enrolment record and student login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="guardian" className="gap-2">
              <Users className="h-4 w-4" />
              Guardian
            </TabsTrigger>
            <TabsTrigger value="academic" className="gap-2">
              <FileText className="h-4 w-4" />
              Academic
            </TabsTrigger>
          </TabsList>

          {/* PERSONAL */}
          <TabsContent value="personal" className="mt-6 space-y-6">
            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              The photo is set by the student after their first sign-in, from Account &amp; security —
              uploads are tied to the signed-in account, so an admin cannot set another person&apos;s.
            </p>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name" required error={form.formState.errors.name?.message}>
                <Input
                  placeholder="e.g. Hamza Tariq"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Date of Birth" required error={form.formState.errors.dateOfBirth?.message}>
                <Input
                  type="date"
                  value={values.dateOfBirth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </Field>
              <Field label="Gender" required error={form.formState.errors.gender?.message}>
                <Select value={values.gender} onValueChange={(v) => set("gender", v as FormState["gender"])}>
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
              <Field label="Blood Group" error={form.formState.errors.bloodGroup?.message}>
                <Input
                  placeholder="e.g. B+"
                  value={values.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                />
              </Field>
              <Field label="Email (student login)" required error={form.formState.errors.email?.message}>
                <Input
                  type="email"
                  placeholder="student@example.pk"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <Input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={values.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <Field label="Address" className="md:col-span-2" error={form.formState.errors.address?.message}>
                <Input
                  placeholder="House, street, area"
                  value={values.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <Field label="City" error={form.formState.errors.city?.message}>
                <Input value={values.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
          </TabsContent>

          {/* GUARDIAN */}
          <TabsContent value="guardian" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Guardian Name" required error={form.formState.errors.guardianName?.message}>
                <Input
                  placeholder="e.g. Tariq Mehmood"
                  value={values.guardianName}
                  onChange={(e) => set("guardianName", e.target.value)}
                />
              </Field>
              <Field label="Relation" required error={form.formState.errors.guardianRelation?.message}>
                <Select
                  value={values.guardianRelation}
                  onValueChange={(v) => set("guardianRelation", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Uncle">Uncle</SelectItem>
                    <SelectItem value="Aunt">Aunt</SelectItem>
                    <SelectItem value="Brother">Brother</SelectItem>
                    <SelectItem value="Sister">Sister</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Guardian Phone" required error={form.formState.errors.guardianPhone?.message}>
                <Input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={values.guardianPhone}
                  onChange={(e) => set("guardianPhone", e.target.value)}
                />
              </Field>
              <Field label="Guardian Email" error={form.formState.errors.guardianEmail?.message}>
                <Input
                  type="email"
                  placeholder="guardian@example.pk"
                  value={values.guardianEmail}
                  onChange={(e) => set("guardianEmail", e.target.value)}
                />
              </Field>
              <Field label="CNIC" error={form.formState.errors.guardianCnic?.message}>
                <Input
                  placeholder="35202-1234567-8"
                  value={values.guardianCnic}
                  onChange={(e) => set("guardianCnic", e.target.value)}
                />
              </Field>
              <Field label="Occupation" error={form.formState.errors.guardianOccupation?.message}>
                <Input
                  placeholder="e.g. Engineer"
                  value={values.guardianOccupation}
                  onChange={(e) => set("guardianOccupation", e.target.value)}
                />
              </Field>
            </div>
          </TabsContent>

          {/* ACADEMIC */}
          <TabsContent value="academic" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Class" error={form.formState.errors.classId?.message}>
                <Select
                  value={values.classId}
                  onValueChange={(v) => {
                    set("classId", v)
                    set("sectionId", "")
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={classesQ.isLoading ? "Loading…" : "Select class"} />
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

              <Field label="Section" error={form.formState.errors.sectionId?.message}>
                <Select
                  value={values.sectionId}
                  onValueChange={(v) => set("sectionId", v)}
                  disabled={!values.classId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !values.classId
                          ? "Select a class first"
                          : sectionsQ.isLoading
                            ? "Loading…"
                            : "Select section"
                      }
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
                <Input
                  placeholder="e.g. 10A05"
                  value={values.rollNo}
                  onChange={(e) => set("rollNo", e.target.value)}
                />
              </Field>
            </div>

            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              The admission number is generated automatically. A temporary password is created for
              the student login and shown once after enrolment.
            </p>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="mt-6 gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Enrolling…" : "Enrol Student"}
          </Button>
        </DialogFooter>
        </form>
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
