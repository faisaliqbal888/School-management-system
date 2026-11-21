"use client"

import { useMemo, useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { StudentTable } from "@/components/students/student-table"
import { StudentFilters, type StudentFilterValues } from "@/components/students/student-filters"
import { AddStudentModal } from "@/components/students/add-student-modal"
import { ImportStudentsModal } from "@/components/students/import-students-modal"
import { EditStudentModal } from "@/components/students/edit-student-modal"
import { StudentDetailModal } from "@/components/students/student-detail-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  Loader2,
  GraduationCap,
  UserCheck,
  UserX,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  exportStudentsCsv,
  useStudents,
  useDeleteStudent,
  type StudentListItem,
  type StudentStatus,
} from "@/lib/hooks/use-students"
import { useApiQuery } from "@/lib/hooks/use-api-query"
import type { PaginationMeta } from "@/lib/hooks/use-api-query"

interface ClassRow {
  id: string
  name: string
  level: number
  _count?: { sections: number; students: number }
}

export default function AdminStudentsPage() {
  const { ready } = useRequireRole("ADMIN")

  const [filters, setFilters] = useState<StudentFilterValues>({
    search: "",
    classId: "all",
    status: "all",
  })
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [exporting, setExporting] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selected, setSelected] = useState<StudentListItem | null>(null)

  // classes for the filter dropdown
  const classesQuery = useApiQuery<ClassRow[]>("/classes?limit=100")

  const queryFilters = useMemo(
    () => ({
      page,
      limit,
      ...(filters.search ? { search: filters.search } : {}),
      ...(filters.classId !== "all" ? { classId: filters.classId } : {}),
      ...(filters.status !== "all" ? { status: filters.status as StudentStatus } : {}),
    }),
    [page, limit, filters],
  )

  const { students, meta, isLoading, error, refetch } = useStudents(queryFilters)
  const removeStudent = useDeleteStudent()

  if (!ready) return <FullPageLoader />

  const classes = (classesQuery.data ?? []).map((c) => ({ id: c.id, name: c.name }))

  const handleFilterChange = (next: StudentFilterValues) => {
    setFilters(next)
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      exportStudentsCsv(queryFilters)
      toast.success("Export started — check your downloads")
    } finally {
      setTimeout(() => setExporting(false), 1000)
    }
  }

  const handleWithdraw = async (student: StudentListItem) => {
    if (!window.confirm(`Withdraw ${student.name}? Their account will be deactivated but records are kept.`)) {
      return
    }
    try {
      const res = await removeStudent(student.id, false)
      toast.success(`${student.name} has been withdrawn`, {
        description: `Status: ${res.status ?? "WITHDRAWN"} · records preserved`,
      })
      refetch()
    } catch (err) {
      toast.error("Could not withdraw student", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const handleCreated = () => {
    setAddOpen(false)
    refetch()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/20">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          {/* Header */}
          <div className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Students Management</h1>
            <p className="mt-1 text-blue-100">
              Manage enrolment, records and accounts for every student
            </p>
          </div>

          {/* Stats — live counts from the API */}
          <StatsGrid meta={meta} isLoading={isLoading} classesCount={classes.length} />

          <StudentFilters
            value={filters}
            onChange={handleFilterChange}
            classes={classes}
            onAddStudent={() => setAddOpen(true)}
            onImportStudents={() => setImportOpen(true)}
            onExport={handleExport}
            isExporting={exporting}
          />

          <StudentTable
            students={students}
            isLoading={isLoading}
            error={error}
            onViewStudent={(s) => {
              setSelected(s)
              setDetailOpen(true)
            }}
            onEditStudent={(s) => {
              setSelected(s)
              setEditOpen(true)
            }}
            onDeleteStudent={handleWithdraw}
          />

          {/* Pagination — real */}
          <Pagination
            meta={meta}
            page={page}
            onPageChange={setPage}
            unit="students"
            isLoading={isLoading}
          />

          <AddStudentModal open={addOpen} onOpenChange={setAddOpen} onCreated={handleCreated} />
          <ImportStudentsModal open={importOpen} onOpenChange={setImportOpen} onImported={refetch} />
          <EditStudentModal
            studentId={editOpen ? (selected?.id ?? null) : null}
            open={editOpen}
            onOpenChange={setEditOpen}
            onUpdated={refetch}
          />
          <StudentDetailModal
            studentId={detailOpen ? (selected?.id ?? null) : null}
            open={detailOpen}
            onOpenChange={setDetailOpen}
            onUpdated={refetch}
          />
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function StatsGrid({
  meta,
  isLoading,
  classesCount,
}: {
  meta: PaginationMeta | null
  isLoading: boolean
  classesCount: number
}) {
  const total = meta?.total ?? 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Students"
        value={isLoading ? null : total.toLocaleString("en-PK")}
        icon={GraduationCap}
        color="from-blue-500 to-blue-600"
        bg="from-blue-50 to-blue-100"
        hint={meta ? `${meta.totalPages} page${meta.totalPages === 1 ? "" : "s"}` : undefined}
      />
      <StatCard
        title="Classes"
        value={isLoading ? null : String(classesCount)}
        icon={UserCheck}
        color="from-emerald-500 to-emerald-600"
        bg="from-emerald-50 to-emerald-100"
        hint="Active academic year"
      />
      <StatCard
        title="Showing"
        value={isLoading ? null : String(meta?.limit ?? 0)}
        icon={Clock}
        color="from-amber-500 to-amber-600"
        bg="from-amber-50 to-amber-100"
        hint={meta ? `Page ${meta.page} of ${meta.totalPages}` : undefined}
      />
      <StatCard
        title="Records"
        value={isLoading ? null : total.toLocaleString("en-PK")}
        icon={UserX}
        color="from-violet-500 to-purple-600"
        bg="from-violet-50 to-violet-100"
        hint="Attendance, fees & results kept"
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  bg,
  hint,
}: {
  title: string
  value: string | null
  icon: React.ElementType
  color: string
  bg: string
  hint?: string
}) {
  return (
    <Card className={`border-0 bg-gradient-to-br ${bg} shadow-md transition-all hover:shadow-lg`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-gray-600">{title}</p>
            {value === null ? (
              <Skeleton className="mt-2 h-9 w-20" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            )}
            {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} shadow-lg`}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function Pagination({
  meta,
  page,
  onPageChange,
  unit,
  isLoading,
}: {
  meta: PaginationMeta | null
  page: number
  onPageChange: (page: number) => void
  unit: string
  isLoading?: boolean
}) {
  if (!meta) return null

  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1
  const to = Math.min(meta.page * meta.limit, meta.total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row">
      <p className="text-sm text-gray-600">
        Showing <span className="font-medium">{from}</span>–<span className="font-medium">{to}</span> of{" "}
        <span className="font-medium">{meta.total.toLocaleString("en-PK")}</span> {unit}
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

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
