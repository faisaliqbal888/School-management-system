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
import { Badge } from "@/components/ui/badge"
import { Loader2, Check, CheckCircle2, Copy, User, Briefcase, Wallet } from "lucide-react"
import {
  useCreateTeacher,
  useTeacherOptions,
  type EmploymentType,
} from "@/lib/hooks/use-teachers"
import { teacherSchema, type TeacherFormValues } from "@/lib/validation/schemas"

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
  baseSalary: 0,
  subjectIds: [] as string[],
}

export function AddTeacherModal({ open, onOpenChange, onCreated }: AddTeacherModalProps) {
  const [tab, setTab] = useState("personal")
  const [error, setError] = useState("")

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: EMPTY,
  })
  const values = form.watch()
  const subjectIds = values.subjectIds ?? []
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ email: string; temporaryPassword: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const createTeacher = useCreateTeacher()
  const { options } = useTeacherOptions(open)

  useEffect(() => {
    if (!open) return
    form.reset(EMPTY)
    setError("")
    setResult(null)
    setCopied(false)
    setTab("personal")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const set = <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
    form.setValue(key, value as never, { shouldDirty: true })

  const toggleSubject = (id: string) => {
    form.setValue(
      "subjectIds",
      subjectIds.includes(id) ? subjectIds.filter((s) => s !== id) : [...subjectIds, id],
      { shouldDirty: true },
    )
  }

  const onInvalid = () => {
    const fields = Object.keys(form.formState.errors)
    if (fields.some((f) => ["joiningDate", "baseSalary", "employmentType"].includes(f))) setTab("salary")
    else if (fields.some((f) => ["department", "designation", "qualification", "specialization"].includes(f)))
      setTab("professional")
    else setTab("personal")
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setError("")
    setSubmitting(true)
    try {
      const res = await createTeacher({
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() || null,
        department: data.department.trim(),
        designation: data.designation.trim(),
        qualification: data.qualification?.trim() || null,
        specialization: data.specialization?.trim() || null,
        joiningDate: data.joiningDate,
        employmentType: data.employmentType,
        baseSalary: Number(data.baseSalary),
        subjectIds: data.subjectIds ?? [],
      })
      setResult(res.credentials)
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the teacher")
    } finally {
      setSubmitting(false)
    }
  }, onInvalid)

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

        <form onSubmit={handleSubmit} noValidate>
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
              <Field label="Full Name" required error={form.formState.errors.name?.message}>
                <Input
                  placeholder="e.g. Sana Riaz"
                  value={values.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>
              <Field label="Email (portal login)" required error={form.formState.errors.email?.message}>
                <Input
                  type="email"
                  placeholder="name@ravischool.edu.pk"
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
              <Field label="Qualification" error={form.formState.errors.qualification?.message}>
                <Input
                  placeholder="e.g. MSc Physics, B.Ed"
                  value={values.qualification}
                  onChange={(e) => set("qualification", e.target.value)}
                />
              </Field>
            </div>
          </TabsContent>

          {/* PROFESSIONAL */}
          <TabsContent value="professional" className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Department" required error={form.formState.errors.department?.message}>
                <Input
                  list="department-options"
                  placeholder="e.g. Mathematics"
                  value={values.department}
                  onChange={(e) => set("department", e.target.value)}
                />
                <datalist id="department-options">
                  {(options?.departments ?? []).map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <Field label="Designation" required error={form.formState.errors.designation?.message}>
                <Input
                  list="designation-options"
                  placeholder="e.g. Senior Teacher"
                  value={values.designation}
                  onChange={(e) => set("designation", e.target.value)}
                />
                <datalist id="designation-options">
                  {(options?.designations ?? []).map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </Field>
              <Field label="Specialization" className="md:col-span-2" error={form.formState.errors.specialization?.message}>
                <Input
                  placeholder="e.g. Algebra & Calculus"
                  value={values.specialization}
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
                    const active = subjectIds.includes(s.id)
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
                {subjectIds.length} selected — you can change these later.
              </p>
            </div>
          </TabsContent>

          {/* EMPLOYMENT */}
          <TabsContent value="salary" className="mt-6 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Joining Date" required error={form.formState.errors.joiningDate?.message}>
                <Input
                  type="date"
                  value={values.joiningDate}
                  onChange={(e) => set("joiningDate", e.target.value)}
                />
              </Field>
              <Field label="Employment Type" error={form.formState.errors.employmentType?.message}>
                <Select
                  value={values.employmentType}
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
              <Field label="Base Salary (PKR / month)" required error={form.formState.errors.baseSalary?.message}>
                <Input
                  type="number"
                  min={0}
                  step={500}
                  placeholder="e.g. 95000"
                  value={values.baseSalary}
                  onChange={(e) => set("baseSalary", Number(e.target.value))}
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitting ? "Saving…" : "Add Teacher"}
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
