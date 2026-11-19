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
import { MoreHorizontal, Eye, Printer, Send, CreditCard } from "lucide-react"
import { cn } from "@/lib/utils"

export interface Invoice {
  id: string
  invoiceNo: string
  studentName: string
  studentAvatar?: string
  class: string
  items: { name: string; amount: number }[]
  totalAmount: number
  paidAmount: number
  dueDate: string
  status: "Paid" | "Pending" | "Overdue" | "Partial"
}

const invoices: Invoice[] = [
  {
    id: "1",
    invoiceNo: "INV-2025-001",
    studentName: "Ali Khan",
    studentAvatar: "/student-boy-portrait.jpg",
    class: "8-A",
    items: [
      { name: "Tuition Fee", amount: 1500 },
      { name: "Lab Fee", amount: 200 },
      { name: "Library Fee", amount: 100 },
    ],
    totalAmount: 1800,
    paidAmount: 1800,
    dueDate: "2025-12-15",
    status: "Paid",
  },
  {
    id: "2",
    invoiceNo: "INV-2025-002",
    studentName: "Sara Ahmed",
    studentAvatar: "/student-girl-portrait.jpg",
    class: "9-B",
    items: [
      { name: "Tuition Fee", amount: 1600 },
      { name: "Lab Fee", amount: 200 },
    ],
    totalAmount: 1800,
    paidAmount: 0,
    dueDate: "2025-12-15",
    status: "Pending",
  },
  {
    id: "3",
    invoiceNo: "INV-2025-003",
    studentName: "Omar Hassan",
    studentAvatar: "/student-boy-portrait-child.jpg",
    class: "7-C",
    items: [
      { name: "Tuition Fee", amount: 1400 },
      { name: "Sports Fee", amount: 300 },
    ],
    totalAmount: 1700,
    paidAmount: 850,
    dueDate: "2025-12-10",
    status: "Partial",
  },
  {
    id: "4",
    invoiceNo: "INV-2025-004",
    studentName: "Fatima Ali",
    studentAvatar: "/student-girl-portrait-teen.jpg",
    class: "10-A",
    items: [
      { name: "Tuition Fee", amount: 1800 },
      { name: "Exam Fee", amount: 500 },
    ],
    totalAmount: 2300,
    paidAmount: 0,
    dueDate: "2025-11-30",
    status: "Overdue",
  },
  {
    id: "5",
    invoiceNo: "INV-2025-005",
    studentName: "Yusuf Ibrahim",
    studentAvatar: "/student-boy-portrait-young.jpg",
    class: "6-B",
    items: [
      { name: "Tuition Fee", amount: 1200 },
      { name: "Activity Fee", amount: 200 },
    ],
    totalAmount: 1400,
    paidAmount: 1400,
    dueDate: "2025-12-15",
    status: "Paid",
  },
  {
    id: "6",
    invoiceNo: "INV-2025-006",
    studentName: "Ayesha Malik",
    class: "8-B",
    items: [
      { name: "Tuition Fee", amount: 1500 },
      { name: "Transport Fee", amount: 400 },
    ],
    totalAmount: 1900,
    paidAmount: 1900,
    dueDate: "2025-12-15",
    status: "Paid",
  },
]

interface InvoiceTableProps {
  onViewInvoice?: (invoice: Invoice) => void
  onRecordPayment?: (invoice: Invoice) => void
}

export function InvoiceTable({ onViewInvoice, onRecordPayment }: InvoiceTableProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([])

  const toggleSelectAll = () => {
    if (selectedInvoices.length === invoices.length) {
      setSelectedInvoices([])
    } else {
      setSelectedInvoices(invoices.map((i) => i.id))
    }
  }

  const toggleSelectInvoice = (id: string) => {
    setSelectedInvoices((prev) => (prev.includes(id) ? prev.filter((iid) => iid !== id) : [...prev, id]))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "bg-success/10 text-success hover:bg-success/20"
      case "Pending":
        return "bg-warning/10 text-warning hover:bg-warning/20"
      case "Overdue":
        return "bg-destructive/10 text-destructive hover:bg-destructive/20"
      case "Partial":
        return "bg-primary/10 text-primary hover:bg-primary/20"
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
              <Checkbox checked={selectedInvoices.length === invoices.length} onCheckedChange={toggleSelectAll} />
            </TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className={cn("group transition-colors", selectedInvoices.includes(invoice.id) && "bg-primary/5")}
            >
              <TableCell>
                <Checkbox
                  checked={selectedInvoices.includes(invoice.id)}
                  onCheckedChange={() => toggleSelectInvoice(invoice.id)}
                />
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm font-medium">{invoice.invoiceNo}</span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={invoice.studentAvatar || "/placeholder.svg"} alt={invoice.studentName} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {invoice.studentName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{invoice.studentName}</p>
                    <p className="text-xs text-muted-foreground">Class {invoice.class}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <span className="font-semibold">${invoice.totalAmount.toLocaleString()}</span>
              </TableCell>
              <TableCell>
                <span
                  className={cn(
                    "font-medium",
                    invoice.paidAmount === invoice.totalAmount
                      ? "text-success"
                      : invoice.paidAmount > 0
                        ? "text-primary"
                        : "text-muted-foreground",
                  )}
                >
                  ${invoice.paidAmount.toLocaleString()}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </TableCell>
              <TableCell>
                <Badge className={cn("border-0", getStatusColor(invoice.status))}>{invoice.status}</Badge>
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
                    <DropdownMenuItem onClick={() => onViewInvoice?.(invoice)}>
                      <Eye className="mr-2 h-4 w-4" />
                      View Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Invoice
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Send className="mr-2 h-4 w-4" />
                      Send Reminder
                    </DropdownMenuItem>
                    {invoice.status !== "Paid" && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onRecordPayment?.(invoice)}>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Record Payment
                        </DropdownMenuItem>
                      </>
                    )}
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
