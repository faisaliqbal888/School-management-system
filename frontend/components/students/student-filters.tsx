"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, SlidersHorizontal, Download, UserPlus } from "lucide-react"

interface StudentFiltersProps {
  onAddStudent?: () => void
}

export function StudentFilters({ onAddStudent }: StudentFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
      <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-10 bg-card border-border" />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[140px] bg-card">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            <SelectItem value="6">Class 6</SelectItem>
            <SelectItem value="7">Class 7</SelectItem>
            <SelectItem value="8">Class 8</SelectItem>
            <SelectItem value="9">Class 9</SelectItem>
            <SelectItem value="10">Class 10</SelectItem>
          </SelectContent>
        </Select>
        <Select defaultValue="all">
          <SelectTrigger className="w-full sm:w-[140px] bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="gap-2 bg-transparent">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>
      <div className="flex gap-2 w-full md:w-auto">
        <Button variant="outline" className="gap-2 flex-1 md:flex-none bg-transparent">
          <Download className="h-4 w-4" />
          Export
        </Button>
        <Button className="gap-2 flex-1 md:flex-none" onClick={onAddStudent}>
          <UserPlus className="h-4 w-4" />
          Add Student
        </Button>
      </div>
    </div>
  )
}
