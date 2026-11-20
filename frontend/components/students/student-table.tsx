"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Phone, AlertCircle, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import type { StudentListItem, StudentStatus } from "@/lib/hooks/use-students"

interface StudentTableProps {
  students: StudentListItem[]
  isLoading?: boolean
  error?: string | null
  onViewStudent?: (student: StudentListItem) => void
  onEditStudent?: (student: StudentListItem) => void
  onDeleteStudent?: (student: StudentListItem) => void
}

const STATUS_STYLES: Record<StudentStatus, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  PENDING: "bg-amber-50 text-amber-700",
  GRADUATED: "bg-blue-50 text-blue-700",
  TRANSFERRED: "bg-violet-50 text-violet-700",
  WITHDRAWN: "bg-red-50 text-red-700",
}

const STATUS_LABELS: Record<StudentStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  PENDING: "Pending",
  GRADUATED: "Graduated",
  TRANSFERRED: "Transferred",
  WITHDRAWN: "Withdrawn",
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase() ?? "")
    .join("")
}

export function StudentTable({
  students,
  isLoading = false,
  error = null,
  onViewStudent,
  onEditStudent,
  onDeleteStudent,
}: StudentTableProps) {
  const [selected, setSelected] = useState<string[]>([])

  const allSelected = students.length > 0 && selected.length === students.length
  const toggleAll = () =>
    setSelected(allSelected ? [] : students.map((s) => s.id))
  const toggleOne = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  // ── loading ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-12" />
              <TableHead>Student</TableHead>
              <TableHead>Admission No</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Guardian</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 6 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                  </div>
                </TableCell>
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j}>
                    <Skeleton className="h-3.5 w-20" />
                  </TableCell>
                ))}
                <TableCell>
                  <Skeleton className="h-8 w-8 rounded" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // ── error ──────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-14 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="font-medium">Could not load students</p>
        <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
      </div>
    )
  }

  // ── empty ──────────────────────────────────────────────────
  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-card px-6 py-16 text-center">
        <Users className="h-9 w-9 text-muted-foreground" />
        <p className="font-medium">No students found</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Try a different search or filter, or enrol a new student.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" />
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Admission No</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Guardian</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.id}
              className={cn(
                "group cursor-pointer transition-colors",
                selected.includes(student.id) && "bg-primary/5",
              )}
              onClick={() => onViewStudent?.(student)}
            >
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selected.includes(student.id)}
                  onCheckedChange={() => toggleOne(student.id)}
                  aria-label={`Select ${student.name}`}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-border">
                    <AvatarImage src={student.avatarUrl ?? "/placeholder.svg"} alt={student.name} />
                    <AvatarFallback className="bg-primary/10 text-sm text-primary">
                      {initials(student.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{student.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{student.admissionNo}</span>
                {student.rollNo && (
                  <p className="text-xs text-muted-foreground">Roll {student.rollNo}</p>
                )}
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {student.className ?? "—"}
                  {student.sectionName ? `-${student.sectionName}` : ""}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {student.gender === "MALE" ? "Male" : student.gender === "FEMALE" ? "Female" : "Other"}
                </Badge>
              </TableCell>
              <TableCell>
                <p className="text-sm">{student.parentName ?? "—"}</p>
                {student.guardianPhone && (
                  <p className="text-xs text-muted-foreground">{student.guardianPhone}</p>
                )}
              </TableCell>
              <TableCell>
                <Badge className={cn("border-0", STATUS_STYLES[student.status] ?? "bg-muted")}>
                  {STATUS_LABELS[student.status] ?? student.status}
                </Badge>
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => onViewStudent?.(student)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditStudent?.(student)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <a href={`mailto:${student.email}`}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    </DropdownMenuItem>
                    {student.guardianPhone && (
                      <DropdownMenuItem asChild>
                        <a href={`tel:${student.guardianPhone}`}>
                          <Phone className="mr-2 h-4 w-4" />
                          Call guardian
                        </a>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDeleteStudent?.(student)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Withdraw
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
