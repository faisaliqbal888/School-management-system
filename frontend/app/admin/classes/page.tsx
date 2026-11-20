"use client"

import { useEffect, useState } from "react"
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
import { BookOpen, Loader2, Plus, Trash2, Users } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
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
  const { classes, isLoading, error, refetch } = useClasses(yearId || undefined)
  const { saveClass, deleteClass, saveSection, deleteSection, isPending } = useAcademicMutations()

  const [selected, setSelected] = useState<ClassRow | null>(null)
  const [classForm, setClassForm] = useState({ name: "", level: "", capacity: "40" })
  const [classDialog, setClassDialog] = useState(false)
  const [sectionForm, setSectionForm] = useState({ name: "", roomNo: "", capacity: "40" })

  const { sections, isLoading: sectionsLoading, refetch: refetchSections } = useSections(selected?.id ?? null)

  // Default to the current academic year once the list arrives.
  useEffect(() => {
    if (!yearId && years.length > 0) {
      setYearId((years.find((year) => year.isCurrent) ?? years[0]!).id)
    }
  }, [years, yearId])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const submitClass = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!yearId) return toast.error("Pick an academic year first")
    try {
      await saveClass({
        name: classForm.name.trim(),
        level: Number(classForm.level),
        capacity: Number(classForm.capacity),
        academicYearId: yearId,
      })
      toast.success(`Class "${classForm.name}" created`)
      setClassDialog(false)
      setClassForm({ name: "", level: "", capacity: "40" })
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the class")
    }
  }

  const submitSection = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selected) return
    try {
      await saveSection({
        classId: selected.id,
        name: sectionForm.name.trim().toUpperCase(),
        roomNo: sectionForm.roomNo.trim() || null,
        capacity: Number(sectionForm.capacity),
      })
      toast.success(`Section ${sectionForm.name.toUpperCase()} added`)
      setSectionForm({ name: "", roomNo: "", capacity: "40" })
      refetchSections()
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the section")
    }
  }

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
                  value={yearId}
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
              <Button onClick={() => setClassDialog(true)} disabled={!yearId}>
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

                      <form onSubmit={submitSection} className="space-y-2 border-t pt-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="space-y-1">
                            <Label htmlFor="sec-name" className="text-xs">
                              Name
                            </Label>
                            <Input
                              id="sec-name"
                              required
                              maxLength={5}
                              value={sectionForm.name}
                              onChange={(event) => setSectionForm({ ...sectionForm, name: event.target.value })}
                              placeholder="C"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="sec-room" className="text-xs">
                              Room
                            </Label>
                            <Input
                              id="sec-room"
                              value={sectionForm.roomNo}
                              onChange={(event) => setSectionForm({ ...sectionForm, roomNo: event.target.value })}
                              placeholder="R-12"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="sec-cap" className="text-xs">
                              Capacity
                            </Label>
                            <Input
                              id="sec-cap"
                              type="number"
                              min={1}
                              max={200}
                              value={sectionForm.capacity}
                              onChange={(event) => setSectionForm({ ...sectionForm, capacity: event.target.value })}
                            />
                          </div>
                        </div>
                        <Button type="submit" size="sm" className="w-full" disabled={isPending}>
                          <Plus className="mr-2 h-4 w-4" /> Add section
                        </Button>
                      </form>
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
          <form onSubmit={submitClass} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="cls-name">Name</Label>
              <Input
                id="cls-name"
                required
                value={classForm.name}
                onChange={(event) => setClassForm({ ...classForm, name: event.target.value })}
                placeholder="Grade 6"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor="cls-level">Level</Label>
                <Input
                  id="cls-level"
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={classForm.level}
                  onChange={(event) => setClassForm({ ...classForm, level: event.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cls-cap">Capacity</Label>
                <Input
                  id="cls-cap"
                  type="number"
                  min={1}
                  max={200}
                  value={classForm.capacity}
                  onChange={(event) => setClassForm({ ...classForm, capacity: event.target.value })}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Creating…" : "Create class"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
