"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  BookOpen,
  Eye,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Trash2,
  Users,
  UserX,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate, formatPKR } from "@/lib/format"
import type { StaffStatus, TeacherListItem } from "@/lib/hooks/use-teachers"
import { cn } from "@/lib/utils"

interface TeacherTableProps {
  teachers: TeacherListItem[]
  isLoading?: boolean
  error?: string | null
  onViewTeacher?: (teacher: TeacherListItem) => void
  onEditTeacher?: (teacher: TeacherListItem) => void
  onTerminateTeacher?: (teacher: TeacherListItem) => void
}

const STATUS_STYLES: Record<StaffStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  ON_LEAVE: "bg-amber-50 text-amber-700 border-amber-200",
  RESIGNED: "bg-slate-100 text-slate-600 border-slate-200",
  TERMINATED: "bg-red-50 text-red-700 border-red-200",
}

const EMPLOYMENT_LABEL: Record<string, string> = {
  PERMANENT: "Permanent",
  CONTRACT: "Contract",
  VISITING: "Visiting",
  PART_TIME: "Part-time",
}

export function TeacherTable({
  teachers,
  isLoading = false,
  error = null,
  onViewTeacher,
  onEditTeacher,
  onTerminateTeacher,
}: TeacherTableProps) {
  if (isLoading) return <TableSkeleton />
  if (error) return <TableError message={error} />

  if (teachers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <UserX className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No teachers found</p>
            <p className="text-sm text-muted-foreground">
              Try clearing the filters or add a new staff member.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Teacher</th>
              <th className="px-4 py-3 font-medium">Department</th>
              <th className="px-4 py-3 font-medium">Subjects</th>
              <th className="px-4 py-3 font-medium">Class teacher</th>
              <th className="px-4 py-3 text-right font-medium">Salary</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id} className="border-t border-border align-top hover:bg-muted/30">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={t.avatarUrl ?? undefined} alt={t.name} />
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials(t.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.employeeNo}</p>
                      <div className="mt-1 flex flex-col gap-0.5 text-xs text-muted-foreground">
                        {t.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {t.email}
                          </span>
                        )}
                        {t.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {t.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3">
                  <p className="font-medium">{t.department}</p>
                  <p className="text-xs text-muted-foreground">{t.designation}</p>
                  <Badge variant="outline" className="mt-1 text-[10px] font-normal">
                    {EMPLOYMENT_LABEL[t.employmentType] ?? t.employmentType}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  {t.subjects.length === 0 ? (
                    <span className="text-xs text-muted-foreground">—</span>
                  ) : (
                    <div className="flex max-w-[180px] flex-wrap gap-1">
                      {t.subjects.slice(0, 3).map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px] font-normal">
                          {s}
                        </Badge>
                      ))}
                      {t.subjects.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{t.subjects.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {t.sectionCount} section{t.sectionCount === 1 ? "" : "s"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {t.studentCount}
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3">
                  {t.classTeacherOf ? (
                    <Badge variant="outline" className="gap-1 border-indigo-200 bg-indigo-50 text-indigo-700">
                      <GraduationCap className="h-3 w-3" />
                      {t.classTeacherOf}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {formatDate(t.joiningDate)}
                  </p>
                </td>

                <td className="px-4 py-3 text-right">
                  {t.baseSalary > 0 ? (
                    <span className="font-medium">{formatPKR(t.baseSalary)}</span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                  {t.qualification && (
                    <p className="text-xs text-muted-foreground">{t.qualification}</p>
                  )}
                </td>

                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[t.status])}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </td>

                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => onViewTeacher?.(t)} title="View">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEditTeacher?.(t)} title="Edit">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewTeacher?.(t)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditTeacher?.(t)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit record
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onTerminateTeacher?.(t)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Terminate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")
}

function TableSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-4 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TableError({ message }: { message: string }) {
  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="py-8 text-center text-sm text-destructive">{message}</CardContent>
    </Card>
  )
}
