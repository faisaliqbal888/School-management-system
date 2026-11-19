"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Download, UserPlus, Loader2 } from "lucide-react"
import type { StaffStatus } from "@/lib/hooks/use-teachers"

export interface TeacherFilterValues {
  search: string
  department: string
  status: StaffStatus | "all"
  employmentType: string
}

interface TeacherFiltersProps {
  value: TeacherFilterValues
  onChange: (next: TeacherFilterValues) => void
  departments: string[]
  onAddTeacher?: () => void
  onExport?: () => void
  isExporting?: boolean
}

export function TeacherFilters({
  value,
  onChange,
  departments,
  onAddTeacher,
  onExport,
  isExporting = false,
}: TeacherFiltersProps) {
  const [searchInput, setSearchInput] = useState(value.search)

  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== value.search) onChange({ ...value, search: searchInput })
    }, 350)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput])

  useEffect(() => {
    setSearchInput(value.search)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.search])

  return (
    <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
      <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
        <div className="relative max-w-sm flex-1 sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, email, employee no…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={value.department}
          onValueChange={(department) => onChange({ ...value, department })}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.status}
          onValueChange={(status) =>
            onChange({ ...value, status: status as TeacherFilterValues["status"] })
          }
        >
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="ON_LEAVE">On leave</SelectItem>
            <SelectItem value="RESIGNED">Resigned</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full gap-2 sm:w-auto">
        {onExport && (
          <Button variant="outline" onClick={onExport} disabled={isExporting} className="gap-2">
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export
          </Button>
        )}
        {onAddTeacher && (
          <Button onClick={onAddTeacher} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Teacher
          </Button>
        )}
      </div>
    </div>
  )
}
