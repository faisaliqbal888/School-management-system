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
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, CheckCircle2, Copy, User, Briefcase, Wallet } from "lucide-react"
import {
  useCreateTeacher,
  useTeacherOptions,
  type EmploymentType,
} from "@/lib/hooks/use-teachers"

interface AddTeacherModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
}

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  qualification: "",
  specialization: "",
  joiningDate: new Date().toISOString().slice(0, 10),
  employmentType: "PERMANENT" as EmploymentType,
  baseSalary: "",
  subjectIds: [] as string[],
}

export function AddTeacherModal({ open, onOpenChange, onCreated }: AddTeacherModalProps) {
  const [tab, setTab] = useState("personal")
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ email: string; temporaryPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const createTeacher = useCreateTeacher()
  const { options } = useTeacherOptions(open)

  useEffect(() => {
    if (!open) return
    setForm(EMPTY)
    setError("")
    setResult(null)
    setCopied(false)
    setTab("personal")
  }, [open])

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

  const validate = (): string | null => {
    if (form.name.trim().length < 2) return "Please enter the teacher's full name"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Please enter a valid email address"
    if (!form.department.trim()) return "Department is required"
    if (!form.designation.trim()) return "Designation is required"
    if (!form.joiningDate) return "Joining date is required"
    if (!form.baseSalary || Number(form.baseSalary) <= 0) return "Enter a valid base salary"
    return null
  }

  const handleSubmit = async () => {
    const missing = validate()
    if (missing) {
      setError(missing)
      if (missing.includes("salary") || missing.includes("Joining")) setTab("salary")
      else if (missing.includes("Department") || missing.includes("Designation")) setTab("professional")
      else setTab("personal")
      return
    }

    setError("")
    setSubmitting(true)
    try {
      const res = await createTeacher({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        department: form.department.trim(),
        designation: form.designation.trim(),
        qualification: form.qualification.trim() || null,
        specialization: form.specialization.trim() || null,
        joiningDate: form.joiningDate,
        employmentType: form.employmentType,
        baseSalary: Number(form.baseSalary),
        subjectIds: form.subjectIds,
      })
      setResult(res.credentials)
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the teacher")
    } finally {
      setSubmitting(false)
    }
  }

  const copyCredentials = async () => {
    if (!result) return
    await navigator.clipboard.writeText(
      `Staff portal login\nEmail: ${result.email}\nTemporary password: ${result.temporaryPassword}`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (result) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <DialogTitle className="text-center">Teacher added</DialogTitle>
            <DialogDescription className="text-center">
              The employee number was generated automatically. Share these credentials — the
              password is shown only once.
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Add New Teacher</DialogTitle>
          <DialogDescription>
            Create the staff record and portal login. Employee number is generated on save.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="personal" className="gap-2">
              <User className="h-4 w-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="professional" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Professional
            </TabsTrigger>
            <TabsTrigger value="salary" className="gap-2">
              <Wallet className="h-4 w-4" />
              Employment
            </TabsTrigger>
          </TabsList>

          {/* PERSONAL */}
          <TabsContent value="personal" className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Full Name" required>
                <Input
                  placeholder="e.g. Sana Riaz"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Email (portal login)" required>
                <Input
                  type="email"
                  placeholder="name@ravischool.edu.pk"
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
              <Field label="Qualification">
                <Input
                  placeholder="e.g. MSc Physics, B.Ed"
                  value={form.qualification}
                  onChange={(e) => set("qualification", e.target.value)}
                />
              </Field>
            </div>
          </TabsContent>

          {/* PROFESSIONAL */}
          <TabsContent value="professional" className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Department" required>
                <Input
                  list="department-options"
                  placeholder="e.g. Mathematics"
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                />
                <datalist id="department-options">
                  {(options?.departments ?? []).map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <Field label="Designation" required>
                <Input
                  list="designation-options"
                  placeholder="e.g. Senior Teacher"
                  value={form.designation}
                  onChange={(e) => set("designation", e.target.value)}
                />
                <datalist id="designation-options">
                  {(options?.designations ?? []).map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <Field label="Specialization" className="md:col-span-2">
                <Input
                  placeholder="e.g. Algebra & Calculus"
                  value={form.specialization}
                  onChange={(e) => set("specialization", e.target.value)}
                />
              </Field>
            </div>

            <div className="space-y-2">
              <Label>Subjects taught</Label>
              <div className="flex flex-wrap gap-1.5 rounded-lg border border-border p-3">
                {(options?.subjects ?? []).length === 0 ? (
                  <span className="text-sm text-muted-foreground">Loading subjects…</span>
                ) : (
                  (options?.subjects ?? []).map((s) => {
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
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {form.subjectIds.length} selected — you can change these later.
              </p>
            </div>
          </TabsContent>

          {/* EMPLOYMENT */}
          <TabsContent value="salary" className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Joining Date" required>
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
                  placeholder="e.g. 95000"
                  value={form.baseSalary}
                  onChange={(e) => set("baseSalary", e.target.value)}
                />
              </Field>
            </div>

            <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              A temporary password is generated for the teacher login and shown once after saving.
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
            {submitting ? "Saving…" : "Add Teacher"}
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
