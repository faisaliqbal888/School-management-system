"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, CheckCircle2, ArrowRight } from "lucide-react"
import { shortDate, type ExamRowLite } from "@/lib/hooks/use-dashboard"

const STATUS_TONE: Record<string, string> = {
  SCHEDULED: "bg-blue-100 text-blue-700",
  ONGOING: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-violet-100 text-violet-700",
  PUBLISHED: "bg-emerald-100 text-emerald-700",
}

interface Props {
  exams: ExamRowLite[] | undefined
  title?: string
  href?: string
}

export function UpcomingEvents({ exams, title, href = "/admin/exams" }: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">{title ?? "Upcoming exams"}</CardTitle>
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <Link href={href} aria-label="All exams">
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {(exams?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
            <CheckCircle2 className="h-7 w-7 text-emerald-500/60" />
            No exams are scheduled.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {exams?.map((exam) => (
              <li key={exam.id} className="rounded-md border p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{exam.title}</p>
                  <Badge className={STATUS_TONE[exam.status] ?? "bg-muted text-muted-foreground"}>
                    {exam.status.toLowerCase()}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {shortDate(exam.date)}
                  </span>
                  <span>{exam.className}</span>
                  <span>{exam.results} results</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
