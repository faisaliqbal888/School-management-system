"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { BookOpen, Loader2, Plus, Trash2, Users } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRequireRole } from "@/lib/auth-context"
import { classSchema, sectionSchema, type ClassFormValues, type SectionFormValues } from "@/lib/validation/schemas"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  useAcademicMutations,
  useAcademicYears,
  useClasses,
  useSections,
  type ClassRow,
  type SectionRow,
} from "@/lib/hooks/use-academics"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AdminClassesPage() {
  const { ready } = useRequireRole("ADMIN")
  const { years, isLoading: yearsLoading } = useAcademicYears()
  const [yearId, setYearId] = useState<string>("")

  // Derive the year instead of syncing it into state: no effect, no cascading
  // render, and the select still shows a sensible default on first paint.
  const effectiveYearId = yearId || (years.find((year) => year.isCurrent) ?? years[0])?.id || ""
  const { classes, isLoading, error, refetch } = useClasses(effectiveYearId || undefined)
  const { saveClass, deleteClass, saveSection, deleteSection, isPending } = useAcademicMutations()

  const [selected, setSelected] = useState<ClassRow | null>(null)
  const [classDialog, setClassDialog] = useState(false)

  const classForm = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { name: "", level: 1, capacity: 40 },
  })
  const sectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: { name: "", roomNo: "", capacity: 40 },
  })

  const { sections, isLoading: sectionsLoading, refetch: refetchSections } = useSections(selected?.id ?? null)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const submitClass = classForm.handleSubmit(async (values) => {
    if (!effectiveYearId) return toast.error("Pick an academic year first")
    try {
      await saveClass({ ...values, name: values.name.trim(), academicYearId: effectiveYearId })
      toast.success(`Class "${values.name}" created`)
      setClassDialog(false)
      classForm.reset()
      refetch()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create the class"
      if (/already exists/i.test(message)) classForm.setError("name", { message })
      else toast.error(message)
    }
  })

  const submitSection = sectionForm.handleSubmit(async (values) => {
    if (!selected) return
    try {
      await saveSection({
        classId: selected.id,
        name: values.name.trim().toUpperCase(),
        roomNo: values.roomNo?.trim() || null,
        capacity: values.capacity,
      })
      toast.success(`Section ${values.name.toUpperCase()} added`)
      sectionForm.reset()
      refetchSections()
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the section")
    }
  })

  const removeClass = async (cls: ClassRow) => {
    try {
      await deleteClass(cls.id)
      toast.success(`"${cls.name}" deleted`)
      if (selected?.id === cls.id) setSelected(null)
      refetch()
    } catch (err) {
      // The API explains exactly what is still attached.
      toast.error(err instanceof Error ? err.message : "Cannot delete this class")
    }
  }

  const removeSection = async (section: SectionRow) => {
    try {
      await deleteSection(section.id)
      toast.success(`Section ${section.name} removed`)
      refetchSections()
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cannot remove this section")
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Classes &amp; sections</h1>
              <p className="text-muted-foreground">The structure every enrolment, subject and timetable hangs off</p>
            </div>
            <div className="flex items-end gap-2">
              <div className="space-y-1">
                <Label htmlFor="year-select" className="text-xs text-muted-foreground">
                  Academic year
                </Label>
                <select
                  id="year-select"
                  className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                  value={effectiveYearId}
                  onChange={(event) => {
                    setYearId(event.target.value)
                    setSelected(null)
                  }}
                  disabled={yearsLoading || years.length === 0}
                >
                  {years.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name}
                      {year.isCurrent ? " (current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={() => setClassDialog(true)} disabled={!effectiveYearId}>
                <Plus className="mr-2 h-4 w-4" /> New class
              </Button>
            </div>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Classes</CardTitle>
                </CardHeader>
                <CardContent>
                  {classes.length === 0 ? (
                    <p className="py-10 text-center text-sm text-muted-foreground">
                      No classes in this year yet — create the first one.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead>
                          <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="py-2">Class</th>
                            <th className="py-2 text-right">Level</th>
                            <th className="py-2 text-right">Sections</th>
                            <th className="py-2 text-right">Students</th>
                            <th className="py-2 text-right">Capacity</th>
                            <th className="py-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {classes.map((cls) => (
                            <tr
                              key={cls.id}
                              className={cn(
                                "border-b last:border-0",
                                selected?.id === cls.id && "bg-primary/5",
                              )}
                            >
                              <td className="py-2">
                                <button
                                  onClick={() => setSelected(cls)}
                                  className="font-medium hover:text-primary hover:underline"
                                >
                                  {cls.name}
                                </button>
                              </td>
                              <td className="py-2 text-right text-muted-foreground">{cls.level}</td>
                              <td className="py-2 text-right">{cls._count?.sections ?? 0}</td>
                              <td className="py-2 text-right">{cls._count?.students ?? 0}</td>
                              <td className="py-2 text-right text-muted-foreground">{cls.capacity}</td>
                              <td className="py-2 text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Delete ${cls.name}`}
                                  disabled={isPending}
                                  onClick={() => removeClass(cls)}
                                >
                                  <Trash2 className="h-4 w-4 text-rose-600" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" />
                    {selected ? `Sections — ${selected.name}` : "Sections"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {selected ? "Each section holds one group of students" : "Pick a class to see its sections"}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!selected ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">No class selected.</p>
                  ) : (
                    <>
                      {sectionsLoading ? (
                        <Skeleton className="h-20 w-full" />
                      ) : sections.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                          This class has no sections yet.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {sections.map((section) => (
                            <div
                              key={section.id}
                              className="flex items-center justify-between rounded-lg border px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium">Section {section.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {section.roomNo ? `Room ${section.roomNo} · ` : ""}
                                  capacity {section.capacity}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete section ${section.name}`}
                                disabled={isPending}
                                onClick={() => removeSection(section)}
                              >
                                <Trash2 className="h-4 w-4 text-rose-600" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Form {...sectionForm}>
                        <form onSubmit={submitSection} className="space-y-2 border-t pt-3" noValidate>
                          <div className="grid grid-cols-3 gap-2">
                            <FormField
                              control={sectionForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Name</FormLabel>
                                  <FormControl>
                                    <Input maxLength={5} placeholder="C" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={sectionForm.control}
                              name="roomNo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Room</FormLabel>
                                  <FormControl>
                                    <Input placeholder="R-12" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={sectionForm.control}
                              name="capacity"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs">Capacity</FormLabel>
                                  <FormControl>
                                    <Input type="number" min={1} max={200} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button type="submit" size="sm" className="w-full" disabled={isPending}>
                            <Plus className="mr-2 h-4 w-4" /> Add section
                          </Button>
                        </form>
                      </Form>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="bg-muted/40">
            <CardContent className="flex flex-wrap items-center gap-3 p-4 text-sm text-muted-foreground">
              <BookOpen className="h-4 w-4" />
              <span>
                Subjects belong to a class. Manage them on the{" "}
                <a href="/admin/subjects" className="font-medium text-primary hover:underline">
                  subjects page
                </a>
                .
              </span>
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={classDialog} onOpenChange={setClassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New class</DialogTitle>
            <DialogDescription>Added to the selected academic year.</DialogDescription>
          </DialogHeader>
          <Form {...classForm}>
            <form onSubmit={submitClass} className="space-y-3" noValidate>
              <FormField
                control={classForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Grade 6" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-2">
                <FormField
                  control={classForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={20} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={classForm.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={200} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? "Creating…" : "Create class"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
