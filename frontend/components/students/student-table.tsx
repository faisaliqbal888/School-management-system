"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Edit, Trash2, Mail, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Student {
  id: string
  admissionNo: string
  name: string
  email: string
  phone: string
  class: string
  section: string
  gender: "Male" | "Female"
  status: "Active" | "Inactive" | "Pending"
  avatar?: string
  parentName: string
  dateOfBirth: string
  address: string
}

const students: Student[] = [
  {
    id: "1",
    admissionNo: "STU-2024-001",
    name: "Ali Khan",
    email: "ali.khan@school.edu",
    phone: "+1 234 567 8901",
    class: "8",
    section: "A",
    gender: "Male",
    status: "Active",
    avatar: "/student-boy-portrait.jpg",
    parentName: "Ahmed Khan",
    dateOfBirth: "2012-05-15",
    address: "123 Main Street, City",
  },
  {
    id: "2",
    admissionNo: "STU-2024-002",
    name: "Sara Ahmed",
    email: "sara.ahmed@school.edu",
    phone: "+1 234 567 8902",
    class: "9",
    section: "B",
    gender: "Female",
    status: "Active",
    avatar: "/student-girl-portrait.jpg",
    parentName: "Mohammad Ahmed",
    dateOfBirth: "2011-08-22",
    address: "456 Oak Avenue, City",
  },
  {
    id: "3",
    admissionNo: "STU-2024-003",
    name: "Omar Hassan",
    email: "omar.hassan@school.edu",
    phone: "+1 234 567 8903",
    class: "7",
    section: "C",
    gender: "Male",
    status: "Pending",
    avatar: "/student-boy-portrait-child.jpg",
    parentName: "Hassan Ali",
    dateOfBirth: "2013-03-10",
    address: "789 Pine Road, City",
  },
  {
    id: "4",
    admissionNo: "STU-2024-004",
    name: "Fatima Ali",
    email: "fatima.ali@school.edu",
    phone: "+1 234 567 8904",
    class: "10",
    section: "A",
    gender: "Female",
    status: "Active",
    avatar: "/student-girl-portrait-teen.jpg",
    parentName: "Ali Raza",
    dateOfBirth: "2010-11-05",
    address: "321 Elm Street, City",
  },
  {
    id: "5",
    admissionNo: "STU-2024-005",
    name: "Yusuf Ibrahim",
    email: "yusuf.ibrahim@school.edu",
    phone: "+1 234 567 8905",
    class: "6",
    section: "B",
    gender: "Male",
    status: "Active",
    avatar: "/student-boy-portrait-young.jpg",
    parentName: "Ibrahim Shah",
    dateOfBirth: "2014-07-18",
    address: "654 Cedar Lane, City",
  },
  {
    id: "6",
    admissionNo: "STU-2024-006",
    name: "Ayesha Malik",
    email: "ayesha.malik@school.edu",
    phone: "+1 234 567 8906",
    class: "8",
    section: "B",
    gender: "Female",
    status: "Active",
    parentName: "Malik Ahmed",
    dateOfBirth: "2012-09-25",
    address: "987 Birch Way, City",
  },
  {
    id: "7",
    admissionNo: "STU-2024-007",
    name: "Hamza Qureshi",
    email: "hamza.qureshi@school.edu",
    phone: "+1 234 567 8907",
    class: "9",
    section: "A",
    gender: "Male",
    status: "Inactive",
    parentName: "Qureshi Sahab",
    dateOfBirth: "2011-02-14",
    address: "147 Maple Drive, City",
  },
  {
    id: "8",
    admissionNo: "STU-2024-008",
    name: "Zainab Hussain",
    email: "zainab.hussain@school.edu",
    phone: "+1 234 567 8908",
    class: "7",
    section: "A",
    gender: "Female",
    status: "Active",
    parentName: "Hussain Khan",
    dateOfBirth: "2013-12-30",
    address: "258 Willow Court, City",
  },
]

interface StudentTableProps {
  onViewStudent?: (student: Student) => void
  onEditStudent?: (student: Student) => void
}

export function StudentTable({ onViewStudent, onEditStudent }: StudentTableProps) {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(students.map((s) => s.id))
    }
  }

  const toggleSelectStudent = (id: string) => {
    setSelectedStudents((prev) => (prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-success/10 text-success hover:bg-success/20"
      case "Inactive":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20"
      case "Pending":
        return "bg-warning/10 text-warning hover:bg-warning/20"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12">
              <Checkbox checked={selectedStudents.length === students.length} onCheckedChange={toggleSelectAll} />
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Admission No</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow
              key={student.id}
              className={cn("group transition-colors", selectedStudents.includes(student.id) && "bg-primary/5")}
            >
              <TableCell>
                <Checkbox
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={() => toggleSelectStudent(student.id)}
                />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 ring-2 ring-border">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{student.admissionNo}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {student.class}-{student.section}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="font-normal">
                  {student.gender}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={cn("border-0", getStatusColor(student.status))}>{student.status}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onViewStudent?.(student)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEditStudent?.(student)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Student
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Student
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
