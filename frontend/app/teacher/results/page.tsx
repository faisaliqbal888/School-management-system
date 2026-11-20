"use client"

import { useMemo, useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { TeacherSidebar } from "@/components/teacher/teacher-sidebar"
import { TeacherHeader } from "@/components/teacher/teacher-header"
import { ExamList } from "@/components/exams/exam-list"
import { MarksEntry } from "@/components/exams/marks-entry"
import { ExamAnalysisPanel } from "@/components/exams/exam-analysis"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, BarChart3, ClipboardList, Loader2 } from "lucide-react"
import { useExams, type ExamRow } from "@/lib/hooks/use-exams"

export default function TeacherResultsPage() {
  const { ready } = useRequireRole("TEACHER")

  const [selectedExamId, setSelectedExamId] = useState<string | null>(null)
  const filters = useMemo(() => ({ page: 1, limit: 50 }), [])
  const { exams, isLoading, error, refetch } = useExams(filters)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const selectExam = (id: string) => setSelectedExamId(id)

  return (
    <div className="min-h-screen bg-background">
      <TeacherSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <TeacherHeader />
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Exams &amp; Results</h1>
            <p className="text-muted-foreground">
              Enter marks for the exams you teach and review performance
            </p>
          </div>

          <Tabs defaultValue="exams" className="space-y-5">
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

            <TabsContent value="exams">
              <ExamList
                exams={exams}
                isLoading={isLoading}
                error={error}
                canManage
                onEnterMarks={(exam: ExamRow) => {
                  setSelectedExamId(exam.id)
                }}
                onAnalyse={(exam: ExamRow) => setSelectedExamId(exam.id)}
              />
            </TabsContent>

            <TabsContent value="marks" className="space-y-4">
              <ExamPicker exams={exams} selectedId={selectedExamId} onSelect={selectExam} />
              {selectedExamId ? (
                <MarksEntry examId={selectedExamId} onSaved={refetch} />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    Choose an exam above to enter marks.
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analysis" className="space-y-4">
              <ExamPicker
                exams={exams.filter((e) => e.resultCount > 0)}
                selectedId={selectedExamId}
                onSelect={selectExam}
                emptyHint="No exams with recorded marks yet."
              />
              <ExamAnalysisPanel examId={selectedExamId} />
            </TabsContent>
          </Tabs>
        </main>
      </div>
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
      <CardContent className="p-4">
        <Select value={selectedId ?? undefined} onValueChange={onSelect}>
          <SelectTrigger>
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
