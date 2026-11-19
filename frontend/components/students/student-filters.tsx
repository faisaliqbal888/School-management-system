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
import type { StudentStatus } from "@/lib/hooks/use-students"

export interface StudentFilterValues {
  search: string
  classId: string
  status: StudentStatus | "all"
}

interface StudentFiltersProps {
  value: StudentFilterValues
  onChange: (next: StudentFilterValues) => void
  classes: { id: string; name: string }[]
  onAddStudent?: () => void
  onExport?: () => void
  isExporting?: boolean
}

export function StudentFilters({
  value,
  onChange,
  classes,
  onAddStudent,
  onExport,
  isExporting = false,
}: StudentFiltersProps) {
  // Debounce search so typing does not fire a request per keystroke.
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
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search name, admission no, guardian…"
            className="border-border bg-card pl-10"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <Select
          value={value.classId}
          onValueChange={(classId) => onChange({ ...value, classId })}
        >
          <SelectTrigger className="w-full bg-card sm:w-[150px]">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {classes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.status}
          onValueChange={(status) => onChange({ ...value, status: status as StudentStatus | "all" })}
        >
          <SelectTrigger className="w-full bg-card sm:w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="GRADUATED">Graduated</SelectItem>
            <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex w-full gap-2 md:w-auto">
        <Button
          variant="outline"
          className="flex-1 gap-2 bg-transparent md:flex-none"
          onClick={onExport}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export
        </Button>
        <Button className="flex-1 gap-2 md:flex-none" onClick={onAddStudent}>
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </div>
    </div>
  )
}
