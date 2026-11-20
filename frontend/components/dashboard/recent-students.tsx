"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowRight, UserPlus } from "lucide-react"
import { shortDate, type RecentStudent } from "@/lib/hooks/use-dashboard"

interface Props {
  students: RecentStudent[] | undefined
  isLoading?: boolean
}

export function RecentStudents({ students, isLoading }: Props) {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-lg font-semibold">Recent enrolments</CardTitle>
          <p className="text-sm text-muted-foreground">Newest students on the register</p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/students" className="gap-1">
            All students <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : (students?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <UserPlus className="h-8 w-8 text-muted-foreground/50" />
            No students have been admitted yet.
          </div>
        ) : (
          <ul className="divide-y">
            {students?.map((student) => (
              <li key={student.id} className="flex items-center gap-3 py-2.5">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={student.avatarUrl ?? undefined} alt={student.name} />
                  <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{student.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {student.admissionNo}
                    {student.className && ` · ${student.className}`}
                    {student.sectionName && `-${student.sectionName}`}
                  </p>
                </div>

                <div className="hidden text-right text-xs text-muted-foreground sm:block">
                  {shortDate(student.enrolledAt)}
                </div>
                <Badge variant={student.status === "ACTIVE" ? "secondary" : "outline"} className="shrink-0">
                  {student.status.toLowerCase()}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
