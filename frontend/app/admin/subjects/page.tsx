"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useAcademicMutations, useClasses, useSubjects, type SubjectRow } from "@/lib/hooks/use-academics"
import { toast } from "sonner"

const emptyForm = { name: "", code: "", classId: "", creditHours: "1", isElective: false }

export default function AdminSubjectsPage() {
  const { ready } = useRequireRole("ADMIN")
  const { classes, isLoading: classesLoading } = useClasses()
  const [classFilter, setClassFilter] = useState("")
  const [search, setSearch] = useState("")
  const { subjects, isLoading, error, refetch } = useSubjects(classFilter || undefined, search || undefined)
  const { saveSubject, deleteSubject, isPending } = useAcademicMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SubjectRow | null>(null)
  const [form, setForm] = useState(emptyForm)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, classId: classFilter || classes[0]?.id || "" })
    setDialogOpen(true)
  }

  const openEdit = (subject: SubjectRow) => {
    setEditing(subject)
    setForm({
      name: subject.name,
      code: subject.code,
      classId: subject.classId,
      creditHours: String(subject.creditHours),
      isElective: subject.isElective,
    })
    setDialogOpen(true)
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      classId: form.classId,
      creditHours: Number(form.creditHours),
      isElective: form.isElective,
    }
    try {
      await saveSubject(payload, editing?.id)
      toast.success(editing ? `"${payload.name}" updated` : `"${payload.name}" created`)
      setDialogOpen(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save the subject")
    }
  }

  const remove = async (subject: SubjectRow) => {
    try {
      await deleteSubject(subject.id)
      toast.success(`"${subject.name}" deleted`)
      refetch()
    } catch (err) {
      // Marks and timetable slots block deletion — the API says which.
      toast.error(err instanceof Error ? err.message : "Cannot delete this subject")
    }
  }

  const byClass = new Map<string, SubjectRow[]>()
  for (const subject of subjects) {
    const key = subject.class?.name ?? "Unassigned"
    byClass.set(key, [...(byClass.get(key) ?? []), subject])
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Subjects</h1>
              <p className="text-muted-foreground">
                {subjects.length} subject{subjects.length === 1 ? "" : "s"} across {byClass.size} class
                {byClass.size === 1 ? "" : "es"}
              </p>
            </div>
            <Button onClick={openCreate} disabled={classesLoading || classes.length === 0}>
              <Plus className="mr-2 h-4 w-4" /> New subject
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or code…"
                className="pl-8"
                aria-label="Search subjects"
              />
            </div>
            <select
              aria-label="Class"
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
              value={classFilter}
              onChange={(event) => setClassFilter(event.target.value)}
            >
              <option value="">All classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : subjects.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No subjects match this filter.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {[...byClass.entries()].map(([className, rows]) => (
                <Card key={className}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">{className}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {rows.length} subject{rows.length === 1 ? "" : "s"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {rows.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-medium">{subject.name}</p>
                            {subject.isElective && <Badge variant="outline">elective</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {subject.code} · {subject.creditHours} credit hour
                            {subject.creditHours === 1 ? "" : "s"}
                          </p>
                        </div>
                        <div className="flex flex-none items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${subject.name}`}
                            onClick={() => openEdit(subject)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Delete ${subject.name}`}
                            disabled={isPending}
                            onClick={() => remove(subject)}
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit subject" : "New subject"}</DialogTitle>
            <DialogDescription>
              Codes must be unique across the school; a subject belongs to exactly one class.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="subj-name">Name</Label>
              <Input
                id="subj-name"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Mathematics"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="subj-code">Code</Label>
                <Input
                  id="subj-code"
                  required
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value })}
                  placeholder="MATH-10"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="subj-credits">Credit hours</Label>
                <Input
                  id="subj-credits"
                  type="number"
                  min={1}
                  max={10}
                  value={form.creditHours}
                  onChange={(event) => setForm({ ...form, creditHours: event.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="subj-class">Class</Label>
              <select
                id="subj-class"
                required
                className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                value={form.classId}
                onChange={(event) => setForm({ ...form, classId: event.target.value })}
              >
                <option value="">Select a class…</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={form.isElective}
                onChange={(event) => setForm({ ...form, isElective: event.target.checked })}
              />
              Elective subject
            </label>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving…" : editing ? "Save changes" : "Create subject"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
