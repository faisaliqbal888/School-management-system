"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRequireRole } from "@/lib/auth-context"
import { useAcademicMutations, useClasses, useSubjects, type SubjectRow } from "@/lib/hooks/use-academics"
import { subjectSchema, type SubjectFormValues } from "@/lib/validation/schemas"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"

const emptyForm: SubjectFormValues = { name: "", code: "", classId: "", creditHours: 1, isElective: false }

export default function AdminSubjectsPage() {
  const { ready } = useRequireRole("ADMIN")
  const { classes, isLoading: classesLoading } = useClasses()
  const [classFilter, setClassFilter] = useState("")
  const [search, setSearch] = useState("")
  const { subjects, isLoading, error, refetch } = useSubjects(classFilter || undefined, search || undefined)
  const { saveSubject, deleteSubject, isPending } = useAcademicMutations()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SubjectRow | null>(null)

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema),
    defaultValues: emptyForm,
  })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const openCreate = () => {
    setEditing(null)
    form.reset({ ...emptyForm, classId: classFilter || classes[0]?.id || "" })
    setDialogOpen(true)
  }

  const openEdit = (subject: SubjectRow) => {
    setEditing(subject)
    form.reset({
      name: subject.name,
      code: subject.code,
      classId: subject.classId,
      creditHours: subject.creditHours,
      isElective: subject.isElective,
    })
    setDialogOpen(true)
  }

  const submit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name.trim(),
      code: values.code.trim().toUpperCase(),
      classId: values.classId,
      creditHours: values.creditHours,
      isElective: values.isElective,
    }
    try {
      await saveSubject(payload, editing?.id)
      toast.success(editing ? `"${payload.name}" updated` : `"${payload.name}" created`)
      setDialogOpen(false)
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not save the subject"
      // Code clashes are only known server-side.
      if (/code/i.test(message) && /use|exists/i.test(message)) form.setError("code", { message })
      else toast.error(message)
    }
  })

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
          <Form {...form}>
            <form onSubmit={submit} className="space-y-3" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <FormControl>
                        <Input placeholder="MATH-10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="creditHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credit hours</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={10} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                        {...field}
                      >
                        <option value="">Select a class…</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isElective"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <input
                        id="is-elective"
                        type="checkbox"
                        className="h-4 w-4 rounded border-input"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                      <FormLabel htmlFor="is-elective" className="!mt-0">
                        Elective subject
                      </FormLabel>
                    </div>
                    <FormDescription>
                      Electives count towards the result average only when taken.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Saving…" : editing ? "Save changes" : "Create subject"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
