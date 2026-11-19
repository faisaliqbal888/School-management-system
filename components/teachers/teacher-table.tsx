"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, MoreHorizontal, Eye, Edit, Trash2, Mail, Phone } from "lucide-react"

const teachers = [
  {
    id: "T001",
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@eduflow.com",
    phone: "+1 234 567 8901",
    department: "Mathematics",
    subjects: ["Algebra", "Calculus"],
    classes: ["10-A", "11-B", "12-A"],
    qualification: "Ph.D. Mathematics",
    experience: "12 years",
    salary: 85000,
    status: "active",
    avatar: "/female-teacher-portrait.png",
  },
  {
    id: "T002",
    name: "Mr. James Williams",
    email: "james.williams@eduflow.com",
    phone: "+1 234 567 8902",
    department: "Science",
    subjects: ["Physics", "Chemistry"],
    classes: ["9-A", "10-B", "11-A"],
    qualification: "M.Sc. Physics",
    experience: "8 years",
    salary: 72000,
    status: "active",
    avatar: "/male-teacher-portrait.png",
  },
  {
    id: "T003",
    name: "Ms. Emily Davis",
    email: "emily.davis@eduflow.com",
    phone: "+1 234 567 8903",
    department: "English",
    subjects: ["English Literature", "Grammar"],
    classes: ["8-A", "8-B", "9-A"],
    qualification: "M.A. English",
    experience: "6 years",
    salary: 65000,
    status: "active",
    avatar: "/young-female-teacher.png",
  },
  {
    id: "T004",
    name: "Mr. Robert Chen",
    email: "robert.chen@eduflow.com",
    phone: "+1 234 567 8904",
    department: "Computer Science",
    subjects: ["Programming", "Web Development"],
    classes: ["10-A", "11-A", "12-B"],
    qualification: "M.Tech Computer Science",
    experience: "10 years",
    salary: 78000,
    status: "on-leave",
    avatar: "/asian-male-teacher.png",
  },
  {
    id: "T005",
    name: "Mrs. Patricia Brown",
    email: "patricia.brown@eduflow.com",
    phone: "+1 234 567 8905",
    department: "History",
    subjects: ["World History", "Civics"],
    classes: ["9-B", "10-A", "11-B"],
    qualification: "M.A. History",
    experience: "15 years",
    salary: 82000,
    status: "active",
    avatar: "/mature-female-teacher.jpg",
  },
]

export function TeacherTable() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      teacher.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Teacher</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Classes</TableHead>
              <TableHead>Experience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.map((teacher) => (
              <TableRow key={teacher.id} className="group hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                      <AvatarImage src={teacher.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {teacher.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{teacher.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>{teacher.email}</span>
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {teacher.department}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((subject) => (
                      <Badge key={subject} variant="secondary" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {teacher.classes.map((cls) => (
                      <span key={cls} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {cls}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{teacher.experience}</TableCell>
                <TableCell>
                  <Badge
                    variant={teacher.status === "active" ? "default" : "secondary"}
                    className={
                      teacher.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }
                  >
                    {teacher.status === "active" ? "Active" : "On Leave"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" /> View Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Phone className="mr-2 h-4 w-4" /> Contact
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
