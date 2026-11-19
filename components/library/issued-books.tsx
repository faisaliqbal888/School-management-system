"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RotateCcw, AlertTriangle } from "lucide-react"

const issuedBooks = [
  {
    id: "I001",
    book: "Introduction to Algorithms",
    student: { name: "John Smith", id: "STU001", avatar: "/student-male-studying.png" },
    issueDate: "2024-11-15",
    dueDate: "2024-12-15",
    status: "active",
  },
  {
    id: "I002",
    book: "Physics for Scientists",
    student: { name: "Emily Davis", id: "STU002", avatar: "/diverse-female-student.png" },
    issueDate: "2024-11-10",
    dueDate: "2024-12-05",
    status: "overdue",
  },
  {
    id: "I003",
    book: "To Kill a Mockingbird",
    student: { name: "Michael Chen", id: "STU003", avatar: "/asian-student-studying.png" },
    issueDate: "2024-11-20",
    dueDate: "2024-12-20",
    status: "active",
  },
  {
    id: "I004",
    book: "Calculus: Early Transcendentals",
    student: { name: "Sarah Johnson", id: "STU004", avatar: "/diverse-female-student.png" },
    issueDate: "2024-11-01",
    dueDate: "2024-12-01",
    status: "overdue",
  },
]

export function IssuedBooks() {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Currently Issued Books</CardTitle>
        <Badge variant="outline" className="font-normal">
          {issuedBooks.length} Active Issues
        </Badge>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Student</TableHead>
              <TableHead>Book</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {issuedBooks.map((issue) => (
              <TableRow key={issue.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={issue.student.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs">
                        {issue.student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{issue.student.name}</p>
                      <p className="text-xs text-muted-foreground">{issue.student.id}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{issue.book}</TableCell>
                <TableCell className="text-muted-foreground">{issue.issueDate}</TableCell>
                <TableCell>{issue.dueDate}</TableCell>
                <TableCell>
                  {issue.status === "overdue" ? (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <RotateCcw className="h-3 w-3" />
                    Return
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
