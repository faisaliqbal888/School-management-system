"use client"

import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Download, CheckCircle, Clock, Eye } from "lucide-react"

const payrollData = [
  {
    id: "EMP001",
    name: "Dr. Sarah Johnson",
    department: "Mathematics",
    designation: "Senior Teacher",
    basic: 65000,
    allowances: 15000,
    deductions: 8500,
    net: 71500,
    status: "paid",
    avatar: "/female-professional-portrait.png",
  },
  {
    id: "EMP002",
    name: "Mr. James Williams",
    department: "Science",
    designation: "Teacher",
    basic: 55000,
    allowances: 12000,
    deductions: 7200,
    net: 59800,
    status: "paid",
    avatar: "/male-professional-portrait.png",
  },
  {
    id: "EMP003",
    name: "Ms. Emily Davis",
    department: "English",
    designation: "Teacher",
    basic: 50000,
    allowances: 10000,
    deductions: 6500,
    net: 53500,
    status: "pending",
    avatar: "/young-woman-portrait.png",
  },
  {
    id: "EMP004",
    name: "Mr. Robert Chen",
    department: "Computer Science",
    designation: "HOD",
    basic: 72000,
    allowances: 18000,
    deductions: 9800,
    net: 80200,
    status: "paid",
    avatar: "/asian-man-portrait.png",
  },
  {
    id: "EMP005",
    name: "Mrs. Linda Martinez",
    department: "Administration",
    designation: "Office Manager",
    basic: 45000,
    allowances: 8000,
    deductions: 5700,
    net: 47300,
    status: "pending",
    avatar: "/mature-woman-portrait.png",
  },
]

export function PayrollTable() {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredPayroll = payrollData.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Download className="h-4 w-4" />
          Export Payroll
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Employee</TableHead>
              <TableHead>Department</TableHead>
              <TableHead className="text-right">Basic</TableHead>
              <TableHead className="text-right">Allowances</TableHead>
              <TableHead className="text-right">Deductions</TableHead>
              <TableHead className="text-right">Net Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayroll.map((emp) => (
              <TableRow key={emp.id} className="group hover:bg-muted/30">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={emp.avatar || "/placeholder.svg"} />
                      <AvatarFallback className="text-xs bg-primary/10 text-primary">
                        {emp.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{emp.name}</p>
                      <p className="text-xs text-muted-foreground">{emp.designation}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal">
                    {emp.department}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-medium">${emp.basic.toLocaleString()}</TableCell>
                <TableCell className="text-right text-emerald-600">+${emp.allowances.toLocaleString()}</TableCell>
                <TableCell className="text-right text-rose-600">-${emp.deductions.toLocaleString()}</TableCell>
                <TableCell className="text-right font-bold">${emp.net.toLocaleString()}</TableCell>
                <TableCell>
                  {emp.status === "paid" ? (
                    <Badge className="gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                      <Clock className="h-3 w-3" />
                      Pending
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="gap-1 bg-transparent">
                    <Eye className="h-3 w-3" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
