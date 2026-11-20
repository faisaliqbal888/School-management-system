"use client"

import { useMemo, useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { ExamList } from "@/components/exams/exam-list"
import { MarksEntry } from "@/components/exams/marks-entry"
import { ExamAnalysisPanel } from "@/components/exams/exam-analysis"
import { ScheduleExamModal } from "@/components/exams/schedule-exam-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Award,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Loader2,
  Plus,
  Search,
  TrendingUp,
} from "lucide-react"
import {
  EXAM_STATUS_LABEL,
  useDeleteExam,
  useExams,
  useUpdateExamStatus,
  type ExamRow,
  type ExamStatus,
} from "@/lib/hooks/use-exams"
import type { PaginationMeta } from "@/lib/hooks/use-api-query"
import { cn } from "@/lib/utils"

const STATUSES: (ExamStatus | "all")[] = ["all", "SCHEDULED", "ONGOING", "COMPLETED", "PUBLISHED"]

export default function AdminExamsPage() {
  const { ready } = useRequireRole("ADMIN")

  const [tab, setTab] = useState("exams")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<ExamStatus | "all">("all")
  const [page, setPage] = useState(1)

  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const [selectedExam, setSelectedExam] = useState<ExamRow | null>(null)

  const filters = useMemo(
    () => ({
      page,
      limit: 8,
      ...(search ? { search } : {}),
      ...(status !== "all" ? { status } : {}),
    }),
    [page, search, status],
  )

  const { exams, meta, isLoading, error, refetch } = useExams(filters)
  const updateStatus = useUpdateExamStatus()
  const deleteExam = useDeleteExam()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const openMarks = (exam: ExamRow) => {
    setSelectedExam(exam)
    setSelectedExamId(exam.id)
    setTab("marks")
  }

  const openAnalysis = (exam: ExamRow) => {
    setSelectedExam(exam)
    setSelectedExamId(exam.id)
    setTab("analysis")
  }

  const handlePublish = async (exam: ExamRow) => {
    if (!window.confirm(`Publish results for "${exam.name}"? Learners and parents will see them.`)) return
    try {
      await updateStatus(exam.id, "PUBLISHED")
      toast.success("Results published", { description: exam.name })
      refetch()
    } catch (err) {
      toast.error("Could not publish results", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  const handleDelete = async (exam: ExamRow) => {
    if (!window.confirm(`Delete "${exam.name}" and all of its results? This cannot be undone.`)) return
    try {
      await deleteExam(exam.id)
      toast.success("Exam deleted", { description: exam.name })
      if (selectedExamId === exam.id) {
        setSelectedExamId(null)
        setSelectedExam(null)
      }
      refetch()
    } catch (err) {
      toast.error("Could not delete the exam", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-amber-50/20">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Exams &amp; Results</h1>
              <p className="mt-1 text-amber-100">
                Schedule exams, enter marks and publish report cards
              </p>
            </div>
            <Button variant="secondary" className="w-fit gap-2" onClick={() => setScheduleOpen(true)}>
              <Plus className="h-4 w-4" />
              Schedule Exam
            </Button>
          </div>

          <ExamStats meta={meta} exams={exams} isLoading={isLoading} />

          <Tabs value={tab} onValueChange={setTab} className="space-y-5">
            <TabsList className="grid w-full max-w-lg grid-cols-3">
              <TabsTrigger value="exams" className="gap-2">
                <ClipboardList className="h-4 w-4" />
                Exams
              </TabsTrigger>
              <TabsTrigger value="marks" className="gap-2">
                <Award className="h-4 w-4" />
                Marks Entry
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analysis
              </TabsTrigger>
            </TabsList>

            {/* EXAMS */}
            <TabsContent value="exams" className="space-y-4">
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search exam or subject…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v as ExamStatus | "all")
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-44">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s === "all" ? "All statuses" : EXAM_STATUS_LABEL[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <ExamList
                exams={exams}
                isLoading={isLoading}
                error={error}
                canManage
                onEnterMarks={openMarks}
                onAnalyse={openAnalysis}
                onPublish={handlePublish}
                onDelete={handleDelete}
              />

              <Pagination meta={meta} page={page} onPageChange={setPage} isLoading={isLoading} />
            </TabsContent>

            {/* MARKS */}
            <TabsContent value="marks" className="space-y-4">
              <ExamPicker
                exams={exams}
                selectedId={selectedExamId}
                onSelect={(id) => {
                  setSelectedExamId(id)
                  setSelectedExam(exams.find((e) => e.id === id) ?? null)
                }}
              />
              {selectedExamId ? (
                <MarksEntry examId={selectedExamId} onSaved={refetch} isAdmin />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    Choose an exam above to enter marks.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* ANALYSIS */}
            <TabsContent value="analysis" className="space-y-4">
              <ExamPicker
                exams={exams.filter((e) => e.resultCount > 0)}
                selectedId={selectedExamId}
                onSelect={(id) => {
                  setSelectedExamId(id)
                  setSelectedExam(exams.find((e) => e.id === id) ?? null)
                }}
                emptyHint="No exams with marks yet."
              />
              <ExamAnalysisPanel examId={selectedExamId} />
            </TabsContent>
          </Tabs>

          <ScheduleExamModal open={scheduleOpen} onOpenChange={setScheduleOpen} onCreated={refetch} />

          {selectedExam && tab !== "exams" && (
            <p className="text-xs text-muted-foreground">
              Viewing: <span className="font-medium text-foreground">{selectedExam.name}</span> ·{" "}
              {selectedExam.className}
              {selectedExam.sectionName ? `-${selectedExam.sectionName}` : ""} ·{" "}
              {selectedExam.subjectName}
            </p>
          )}
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function ExamStats({
  meta,
  exams,
  isLoading,
}: {
  meta: PaginationMeta | null
  exams: ExamRow[]
  isLoading: boolean
}) {
  const published = exams.filter((e) => e.status === "PUBLISHED").length
  const scheduled = exams.filter((e) => e.status === "SCHEDULED").length
  const marked = exams.reduce((s, e) => s + e.resultCount, 0)
  const averages = exams.map((e) => e.averagePercent).filter((v): v is number => v !== null)
  const overallAvg =
    averages.length === 0 ? null : Math.round((averages.reduce((a, b) => a + b, 0) / averages.length) * 10) / 10

  const cards = [
    {
      title: "Total exams",
      value: meta ? String(meta.total) : "—",
      hint: `${scheduled} scheduled`,
      icon: CalendarDays,
      tone: "from-blue-500 to-blue-600",
      bg: "from-blue-50 to-blue-100",
    },
    {
      title: "Published",
      value: String(published),
      hint: "visible to learners",
      icon: CheckCircle2,
      tone: "from-emerald-500 to-emerald-600",
      bg: "from-emerald-50 to-emerald-100",
    },
    {
      title: "Results recorded",
      value: String(marked),
      hint: "this page",
      icon: ClipboardList,
      tone: "from-violet-500 to-purple-600",
      bg: "from-violet-50 to-violet-100",
    },
    {
      title: "Average score",
      value: overallAvg !== null ? `${overallAvg}%` : "—",
      hint: "across listed exams",
      icon: TrendingUp,
      tone: "from-amber-500 to-orange-600",
      bg: "from-amber-50 to-amber-100",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.title} className={cn("border-0 bg-gradient-to-br shadow-md", c.bg)}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                  {c.title}
                </p>
                {isLoading ? (
                  <Skeleton className="mt-2 h-8 w-16" />
                ) : (
                  <p className="mt-1.5 text-2xl font-bold text-gray-900">{c.value}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
              </div>
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow",
                  c.tone,
                )}
              >
                <c.icon className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ExamPicker({
  exams,
  selectedId,
  onSelect,
  emptyHint,
}: {
  exams: ExamRow[]
  selectedId: string | null
  onSelect: (id: string) => void
  emptyHint?: string
}) {
  if (exams.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          {emptyHint ?? "No exams available."}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <span className="text-xs font-medium text-muted-foreground">Exam</span>
        <Select value={selectedId ?? undefined} onValueChange={onSelect}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Choose an exam…" />
          </SelectTrigger>
          <SelectContent>
            {exams.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} · {e.className}
                {e.sectionName ? `-${e.sectionName}` : ""} · {e.resultCount} results
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
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

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row">
      <p className="text-sm text-gray-600">
        <span className="font-medium">{meta.total.toLocaleString("en-PK")}</span> exams · page{" "}
        {meta.page} of {meta.totalPages}
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
