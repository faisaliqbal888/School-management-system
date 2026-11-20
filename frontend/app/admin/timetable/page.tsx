"use client"

import { useMemo, useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, Plus, CalendarDays, BookOpen, Users, Trash2 } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import {
  useDeleteSlot,
  useSectionTimetable,
  useTeacherTimetable,
  useTimetableOptions,
  type SlotRow,
} from "@/lib/hooks/use-timetable"

import { WeeklyTimetable } from "@/components/timetable/weekly-timetable"
import { SlotEditorModal, type SlotDraft } from "@/components/timetable/slot-editor-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

const selectClass =
  "h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

type ViewMode = "section" | "teacher"

export default function AdminTimetablePage() {
  const { ready } = useRequireRole("ADMIN")
  const { options, isLoading: optionsLoading } = useTimetableOptions()

  const [mode, setMode] = useState<ViewMode>("section")
  const [classId, setClassId] = useState("")
  const [sectionId, setSectionId] = useState("")
  const [teacherId, setTeacherId] = useState("")

  const [draft, setDraft] = useState<SlotDraft | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<SlotRow | null>(null)
  const deleteSlot = useDeleteSlot()

  const activeClassId = classId || options?.classes[0]?.id || ""
  const activeSectionId =
    sectionId ||
    options?.classes.find((c: { id: string; sections: { id: string }[] }) => c.id === activeClassId)?.sections[0]?.id ||
    ""
  const activeTeacherId = teacherId || options?.teachers[0]?.id || ""

  const sectionQuery = useSectionTimetable(mode === "section" ? activeSectionId : undefined)
  const teacherQuery = useTeacherTimetable(mode === "teacher" ? activeTeacherId : undefined)
  const optionsQuery = useTimetableOptions()

  const grid = mode === "section" ? sectionQuery.grid : teacherQuery.grid
  const isLoading = mode === "section" ? sectionQuery.isLoading : teacherQuery.isLoading

  const refreshViews = () => {
    sectionQuery.refetch()
    teacherQuery.refetch()
    optionsQuery.refetch()
  }

  const stats = useMemo(() => {
    const slots = grid?.slots ?? []
    return {
      lessons: slots.length,
      subjects: new Set(slots.map((s: SlotRow) => s.subjectId)).size,
      teachers: new Set(slots.map((s: SlotRow) => s.teacherId).filter(Boolean)).size,
      rooms: new Set(slots.map((s: SlotRow) => s.roomNo).filter(Boolean)).size,
    }
  }, [grid])

  if (!ready || optionsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const openCreate = (day?: string, startTime?: string) => {
    if (mode === "teacher") {
      toast.info("Pick a section first", {
        description: "Slots are added per section — switch the view to Section.",
      })
      return
    }
    setDraft({ classId: activeClassId, sectionId: activeSectionId, day, startTime })
    setEditorOpen(true)
  }

  const openEdit = (slotId: string) => {
    const slot = grid?.slots.find((s: SlotRow) => s.id === slotId)
    if (!slot) return
    setDraft({ slot })
    setEditorOpen(true)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteSlot.mutate(pendingDelete.id)
      refreshViews()
      toast.success("Slot removed", {
        description: `${pendingDelete.subjectName} was deleted from the timetable.`,
      })
    } catch {
      toast.error("Could not delete slot")
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Timetable</h1>
              <p className="text-muted-foreground">Weekly class schedule by section or teacher</p>
            </div>
            <Button onClick={() => openCreate()}>
              <Plus className="mr-2 h-4 w-4" /> Add class
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Lessons / week", value: stats.lessons, icon: CalendarDays },
              { label: "Subjects", value: stats.subjects, icon: BookOpen },
              { label: "Teachers", value: stats.teachers, icon: Users },
              { label: "Rooms in use", value: stats.rooms, icon: CalendarDays },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0 pb-3">
              <CardTitle className="text-base">
                {mode === "section"
                  ? `${grid?.scope.className ?? "Class"} ${grid?.scope.sectionName ?? ""}`.trim()
                  : `${grid?.scope.teacherName ?? "Teacher"}’s schedule`}
              </CardTitle>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-md border p-0.5">
                  {(["section", "teacher"] as ViewMode[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMode(value)}
                      className={`rounded px-2.5 py-1 text-sm capitalize transition ${
                        mode === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>

                {mode === "section" ? (
                  <>
                    <select
                      aria-label="Class"
                      className={selectClass}
                      value={activeClassId}
                      onChange={(event) => {
                        setClassId(event.target.value)
                        setSectionId("")
                      }}
                    >
                      {options?.classes.map((c: { id: string; name: string }) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select
                      aria-label="Section"
                      className={selectClass}
                      value={activeSectionId}
                      onChange={(event) => setSectionId(event.target.value)}
                    >
                      {options?.classes
                        .find((c) => c.id === activeClassId)
                        ?.sections.map((s) => (
                          <option key={s.id} value={s.id}>
                            Section {s.name}
                          </option>
                        ))}
                    </select>
                  </>
                ) : (
                  <select
                    aria-label="Teacher"
                    className={selectClass}
                    value={activeTeacherId}
                    onChange={(event) => setTeacherId(event.target.value)}
                  >
                    {options?.teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                )}

                {grid?.slots.length ? (
                  <Badge variant="secondary">{grid.slots.length} lessons</Badge>
                ) : null}
              </div>
            </CardHeader>
            <CardContent>
              <WeeklyTimetable
                grid={grid}
                isLoading={isLoading}
                canManage
                onCreate={openCreate}
                onEdit={openEdit}
                onDelete={(slotId) => {
                  const slot = grid?.slots.find((s: SlotRow) => s.id === slotId)
                  if (slot) setPendingDelete(slot)
                }}
                emptyHint="This section has no lessons yet — add the first one to get started."
              />
            </CardContent>
          </Card>
        </main>
      </div>

      <SlotEditorModal
        open={editorOpen}
        draft={draft}
        onClose={() => setEditorOpen(false)}
        onSaved={refreshViews}
      />

      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this class?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `${pendingDelete.subjectName} on ${pendingDelete.dayOfWeek} at ${pendingDelete.startTime} will be removed from the timetable.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
