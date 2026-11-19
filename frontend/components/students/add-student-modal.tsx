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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Camera, User, Users, FileText, Loader2, Copy, Check, CheckCircle2 } from "lucide-react"
import { useApiQuery } from "@/lib/hooks/use-api-query"
import { useCreateStudent } from "@/lib/hooks/use-students"

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
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [error, setError] = useState("")
  const [result, setResult] = useState<{ email: string; temporaryPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const createStudent = useCreateStudent()
  const [submitting, setSubmitting] = useState(false)

  const classesQ = useApiQuery<ClassRow[]>("/classes?limit=100", { enabled: open })
  const sectionsQ = useApiQuery<SectionRow[]>(
    form.classId ? `/classes/${form.classId}/sections` : null,
    { enabled: open && !!form.classId },
  )

  // reset whenever the modal opens
  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM)
      setError("")
      setResult(null)
      setCopied(false)
      setTab("personal")
    }
  }, [open])

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const validate = (): string | null => {
    if (form.name.trim().length < 2) return "Please enter the student's full name"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address"
    if (!form.dateOfBirth) return "Date of birth is required"
    if (!form.gender) return "Please select a gender"
    if (form.guardianName.trim().length < 2) return "Guardian name is required"
    if (form.guardianPhone.trim().length < 7) return "Guardian phone number is required"
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      // jump to the tab that owns the failing field
      if (validationError.toLowerCase().includes("guardian")) setTab("guardian")
      else setTab("personal")
      return
    }

    setError("")
    setSubmitting(true)
    try {
      const res = await createStudent({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender as "MALE" | "FEMALE" | "OTHER",
        bloodGroup: form.bloodGroup.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        classId: form.classId || undefined,
        sectionId: form.sectionId || undefined,
        rollNo: form.rollNo.trim() || undefined,
        guardian: {
          name: form.guardianName.trim(),
          relation: form.guardianRelation,
          phone: form.guardianPhone.trim(),
          email: form.guardianEmail.trim() || undefined,
          cnic: form.guardianCnic.trim() || undefined,
          occupation: form.guardianOccupation.trim() || undefined,
        },
      })
      setResult(res.credentials)
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not enrol the student")
    } finally {
      setSubmitting(false)
    }
  }

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
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 ring-4 ring-border">
                <AvatarFallback className="bg-primary/10 text-2xl text-primary">
                  {form.name
                    .split(" ")
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((n) => n[0]?.toUpperCase())
                    .join("") || "ST"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium">Photo</p>
                <p className="text-xs text-muted-foreground">
                  Photo upload arrives with file storage in a later phase
                </p>
              </div>
              <Button size="icon" variant="outline" className="ml-auto" disabled>
                <Camera className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name" required>
                <Input
                  placeholder="e.g. Hamza Tariq"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Date of Birth" required>
                <Input
                  type="date"
                  value={form.dateOfBirth}
                  max={new Date().toISOString().slice(0, 10)}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </Field>
              <Field label="Gender" required>
                <Select value={form.gender} onValueChange={(v) => set("gender", v as FormState["gender"])}>
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
              <Field label="Blood Group">
                <Input
                  placeholder="e.g. B+"
                  value={form.bloodGroup}
                  onChange={(e) => set("bloodGroup", e.target.value)}
                />
              </Field>
              <Field label="Email (student login)" required>
                <Input
                  type="email"
                  placeholder="student@example.pk"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <Input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <Field label="Address" className="md:col-span-2">
                <Input
                  placeholder="House, street, area"
                  value={form.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
              <Field label="City">
                <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
              </Field>
            </div>
          </TabsContent>

          {/* GUARDIAN */}
          <TabsContent value="guardian" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Guardian Name" required>
                <Input
                  placeholder="e.g. Tariq Mehmood"
                  value={form.guardianName}
                  onChange={(e) => set("guardianName", e.target.value)}
                />
              </Field>
              <Field label="Relation" required>
                <Select
                  value={form.guardianRelation}
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
              <Field label="Guardian Phone" required>
                <Input
                  type="tel"
                  placeholder="+92 300 1234567"
                  value={form.guardianPhone}
                  onChange={(e) => set("guardianPhone", e.target.value)}
                />
              </Field>
              <Field label="Guardian Email">
                <Input
                  type="email"
                  placeholder="guardian@example.pk"
                  value={form.guardianEmail}
                  onChange={(e) => set("guardianEmail", e.target.value)}
                />
              </Field>
              <Field label="CNIC">
                <Input
                  placeholder="35202-1234567-8"
                  value={form.guardianCnic}
                  onChange={(e) => set("guardianCnic", e.target.value)}
                />
              </Field>
              <Field label="Occupation">
                <Input
                  placeholder="e.g. Engineer"
                  value={form.guardianOccupation}
                  onChange={(e) => set("guardianOccupation", e.target.value)}
                />
              </Field>
            </div>
          </TabsContent>

          {/* ACADEMIC */}
          <TabsContent value="academic" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Class">
                <Select
                  value={form.classId}
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

              <Field label="Section">
                <Select
                  value={form.sectionId}
                  onValueChange={(v) => set("sectionId", v)}
                  disabled={!form.classId}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !form.classId
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

              <Field label="Roll Number">
                <Input
                  placeholder="e.g. 10A05"
                  value={form.rollNo}
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Enrolling…" : "Enrol Student"}
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
