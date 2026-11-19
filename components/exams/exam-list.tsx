"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Calendar, Users, FileText, ChevronRight, Edit, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Exam {
  id: string
  name: string
  type: "Mid-Term" | "Final" | "Unit Test" | "Quiz"
  startDate: string
  endDate: string
  classes: string[]
  totalStudents: number
  resultsPublished: boolean
  progress: number
  status: "Upcoming" | "In Progress" | "Completed"
}

const exams: Exam[] = [
  {
    id: "1",
    name: "Mid-Term Examination 2025",
    type: "Mid-Term",
    startDate: "2025-12-15",
    endDate: "2025-12-20",
    classes: ["6", "7", "8", "9", "10"],
    totalStudents: 2847,
    resultsPublished: false,
    progress: 0,
    status: "Upcoming",
  },
  {
    id: "2",
    name: "Unit Test - November",
    type: "Unit Test",
    startDate: "2025-11-25",
    endDate: "2025-11-27",
    classes: ["8", "9", "10"],
    totalStudents: 1420,
    resultsPublished: true,
    progress: 100,
    status: "Completed",
  },
  {
    id: "3",
    name: "Science Quiz",
    type: "Quiz",
    startDate: "2025-12-05",
    endDate: "2025-12-05",
    classes: ["9", "10"],
    totalStudents: 890,
    resultsPublished: true,
    progress: 100,
    status: "Completed",
  },
  {
    id: "4",
    name: "Mathematics Assessment",
    type: "Unit Test",
    startDate: "2025-12-10",
    endDate: "2025-12-10",
    classes: ["7", "8"],
    totalStudents: 720,
    resultsPublished: false,
    progress: 65,
    status: "In Progress",
  },
]

interface ExamListProps {
  onViewExam?: (exam: Exam) => void
  onEditExam?: (exam: Exam) => void
}

export function ExamList({ onViewExam, onEditExam }: ExamListProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-success/10 text-success hover:bg-success/20"
      case "In Progress":
        return "bg-primary/10 text-primary hover:bg-primary/20"
      case "Upcoming":
        return "bg-warning/10 text-warning hover:bg-warning/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Mid-Term":
        return "bg-chart-4/10 text-chart-4"
      case "Final":
        return "bg-destructive/10 text-destructive"
      case "Unit Test":
        return "bg-chart-5/10 text-chart-5"
      case "Quiz":
        return "bg-accent/10 text-accent"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-4">
      {exams.map((exam) => (
        <Card key={exam.id} className="border-0 shadow-sm hover:shadow-md transition-shadow group">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              {/* Main Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={cn("border-0 text-xs", getTypeColor(exam.type))}>{exam.type}</Badge>
                      <Badge className={cn("border-0 text-xs", getStatusColor(exam.status))}>{exam.status}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{exam.name}</h3>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(exam.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {exam.startDate !== exam.endDate &&
                        ` - ${new Date(exam.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{exam.totalStudents.toLocaleString()} students</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Classes: {exam.classes.join(", ")}</span>
                  </div>
                </div>

                {/* Progress */}
                {exam.status !== "Upcoming" && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        {exam.status === "Completed" ? "Results Entry" : "Marks Entry Progress"}
                      </span>
                      <span className="font-medium">{exam.progress}%</span>
                    </div>
                    <Progress value={exam.progress} className="h-2" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                {exam.status === "Completed" && exam.resultsPublished && (
                  <Button variant="outline" size="sm" onClick={() => onViewExam?.(exam)} className="gap-2">
                    <Eye className="h-4 w-4" />
                    View Results
                  </Button>
                )}
                {exam.status === "In Progress" && (
                  <Button size="sm" onClick={() => onEditExam?.(exam)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Enter Marks
                  </Button>
                )}
                {exam.status === "Upcoming" && (
                  <Button variant="outline" size="sm" onClick={() => onEditExam?.(exam)} className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Exam
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
