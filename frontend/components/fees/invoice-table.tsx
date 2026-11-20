"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, Receipt, ReceiptText, Wallet } from "lucide-react"
import { formatDate, formatPKR } from "@/lib/format"
import type { InvoiceRow, InvoiceStatus } from "@/lib/hooks/use-fees"
import { cn } from "@/lib/utils"

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700 border-amber-200",
  PARTIAL: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-700 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  WAIVED: "bg-violet-50 text-violet-700 border-violet-200",
}

interface InvoiceTableProps {
  invoices: InvoiceRow[]
  isLoading?: boolean
  error?: string | null
  onViewInvoice?: (invoice: InvoiceRow) => void
  onRecordPayment?: (invoice: InvoiceRow) => void
  /** Hide the student column (student/parent views). */
  hideStudent?: boolean
  /** Show the record-payment action (admin only). */
  canRecordPayment?: boolean
}

export function InvoiceTable({
  invoices,
  isLoading = false,
  error = null,
  onViewInvoice,
  onRecordPayment,
  hideStudent = false,
  canRecordPayment = false,
}: InvoiceTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="py-8 text-center text-sm text-destructive">{error}</CardContent>
      </Card>
    )
  }

  if (invoices.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <ReceiptText className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium">No invoices found</p>
          <p className="text-sm text-muted-foreground">
            Adjust the filters or raise a new invoice to get started.
          </p>
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
              <th className="px-4 py-3 font-medium">Invoice</th>
              {!hideStudent && <th className="px-4 py-3 font-medium">Student</th>}
              <th className="px-4 py-3 text-right font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Paid</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Due</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs">{invoice.invoiceNo}</p>
                  <p className="mt-0.5 font-medium">{invoice.title}</p>
                  {invoice.period && (
                    <p className="text-xs text-muted-foreground">{invoice.period}</p>
                  )}
                </td>

                {!hideStudent && (
                  <td className="px-4 py-3">
                    <p className="font-medium">{invoice.studentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.className}
                      {invoice.sectionName ? `-${invoice.sectionName}` : ""} · {invoice.admissionNo}
                    </p>
                  </td>
                )}

                <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                  {formatPKR(invoice.totalAmount)}
                  {(invoice.discount > 0 || invoice.fine > 0) && (
                    <p className="text-[10px] font-normal text-muted-foreground">
                      {invoice.discount > 0 ? `−${formatPKR(invoice.discount)} discount` : ""}
                      {invoice.discount > 0 && invoice.fine > 0 ? " · " : ""}
                      {invoice.fine > 0 ? `+${formatPKR(invoice.fine)} fine` : ""}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-emerald-700">
                  {formatPKR(invoice.paidAmount)}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap px-4 py-3 text-right font-medium",
                    invoice.balance > 0 ? "text-red-600" : "text-muted-foreground",
                  )}
                >
                  {formatPKR(invoice.balance)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                  {formatDate(invoice.dueDate)}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[invoice.status])}>
                    {invoice.status}
                  </Badge>
                  {invoice.paymentsCount > 0 && (
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {invoice.paymentsCount} payment{invoice.paymentsCount === 1 ? "" : "s"}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewInvoice?.(invoice)}
                      title="View invoice"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canRecordPayment && invoice.balance > 0 && invoice.status !== "WAIVED" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRecordPayment?.(invoice)}
                        title="Record payment"
                        className="text-emerald-600 hover:text-emerald-700"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                    )}
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

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge variant="outline" className={cn("text-[10px]", STATUS_STYLES[status])}>
      <Receipt className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  )
}
