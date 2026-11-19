"use client"

import { useMemo, useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { TeacherTable } from "@/components/teachers/teacher-table"
import { TeacherFilters, type TeacherFilterValues } from "@/components/teachers/teacher-filters"
import { AddTeacherModal } from "@/components/teachers/add-teacher-modal"
import { EditTeacherModal } from "@/components/teachers/edit-teacher-modal"
import { TeacherDetailModal } from "@/components/teachers/teacher-detail-modal"
import { DepartmentStats } from "@/components/teachers/department-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import {
  exportTeachersCsv,
  useDeleteTeacher,
  useTeacherOptions,
  useTeachers,
  type StaffStatus,
  type TeacherListItem,
} from "@/lib/hooks/use-teachers"
import type { PaginationMeta } from "@/lib/hooks/use-api-query"

type Tab = "overview" | "all-teachers"

export default function AdminTeachersPage() {
  const { ready } = useRequireRole("ADMIN")

  const [tab, setTab] = useState<Tab>("overview")
  const [filters, setFilters] = useState<TeacherFilterValues>({
    search: "",
    department: "all",
    status: "all",
    employmentType: "all",
  })
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<TeacherListItem | null>(null)

  const { options } = useTeacherOptions(ready)

  // Overview needs the whole faculty; the table page is paginated.
  const overviewFilters = useMemo(() => ({ page: 1, limit: 100 }), [])
  const overviewQ = useTeachers(overviewFilters)

  const queryFilters = useMemo(
    () => ({
      page,
      limit: 10,
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.department !== "all" ? { department: filters.department } : {}),
      ...(filters.status !== "all" ? { status: filters.status as StaffStatus } : {}),
      ...(filters.employmentType !== "all" ? { employmentType: filters.employmentType as never } : {}),
    }),
    [page, filters],
  )

  const { teachers, meta, isLoading, error, refetch } = useTeachers(queryFilters)
  const terminateTeacher = useDeleteTeacher()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const handleFilterChange = (next: TeacherFilterValues) => {
    setFilters(next)
    setPage(1)
  }

  const handleExport = () => {
    setExporting(true)
    try {
      exportTeachersCsv(queryFilters)
      toast.success("Export started — check your downloads")
    } finally {
      setTimeout(() => setExporting(false), 1000)
    }
  }

  const handleTerminate = async (teacher: TeacherListItem) => {
    if (
      !window.confirm(
        `Terminate ${teacher.name}? The staff login will be disabled and the record kept for history.`,
      )
    ) {
      return
    }
    try {
      await terminateTeacher(teacher.id, false)
      toast.success(`${teacher.name} has been terminated`, {
        description: "Login disabled · payroll and timetable history preserved",
      })
      refetch()
      overviewQ.refetch()
    } catch (err) {
      toast.error("Could not terminate teacher", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const refreshAll = () => {
    refetch()
    overviewQ.refetch()
  }

  const selectDepartment = (department: string) => {
    setFilters((prev) => ({ ...prev, department }))
    setPage(1)
    setTab("all-teachers")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/20">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Teachers &amp; Staff</h1>
            <p className="mt-1 text-purple-100">
              Manage faculty records, departments, subjects and staff accounts
            </p>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="space-y-6">
            <TabsList className="grid w-full max-w-sm grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="all-teachers">All Teachers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <DepartmentStats
                teachers={overviewQ.teachers}
                total={overviewQ.meta?.total ?? 0}
                isLoading={overviewQ.isLoading}
                onSelectDepartment={selectDepartment}
              />
            </TabsContent>

            <TabsContent value="all-teachers" className="space-y-4">
              <TeacherFilters
                value={filters}
                onChange={handleFilterChange}
                departments={options?.departments ?? []}
                onAddTeacher={() => setAddOpen(true)}
                onExport={handleExport}
                isExporting={exporting}
              />

              <TeacherTable
                teachers={teachers}
                isLoading={isLoading}
                error={error}
                onViewTeacher={(t) => {
                  setSelected(t)
                  setDetailOpen(true)
                }}
                onEditTeacher={(t) => {
                  setSelected(t)
                  setEditOpen(true)
                }}
                onTerminateTeacher={handleTerminate}
              />

              <Pagination meta={meta} page={page} onPageChange={setPage} isLoading={isLoading} />
            </TabsContent>
          </Tabs>

          <AddTeacherModal open={addOpen} onOpenChange={setAddOpen} onCreated={refreshAll} />
          <EditTeacherModal
            teacherId={editOpen ? (selected?.id ?? null) : null}
            open={editOpen}
            onOpenChange={setEditOpen}
            onUpdated={refreshAll}
          />
          <TeacherDetailModal
            teacherId={detailOpen ? (selected?.id ?? null) : null}
            open={detailOpen}
            onOpenChange={setDetailOpen}
          />
        </main>
      </div>
    </div>
  )
}

function Pagination({
  meta,
  page,
  onPageChange,
  isLoading,
}: {
  meta: PaginationMeta | null
  page: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}) {
  if (!meta) return null

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span>{" "}
        of <span className="font-medium">{meta.total.toLocaleString("en-PK")}</span> teachers
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <span className="px-2 text-sm text-muted-foreground">
          {meta.page} / {meta.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
          disabled={page >= meta.totalPages || isLoading}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
