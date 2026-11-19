"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CreditCard, AlertCircle, CheckCircle2 } from "lucide-react"

const feeInvoices = [
  {
    id: "INV-2024-001",
    description: "Tuition Fee - December 2024",
    amount: 450,
    dueDate: "Dec 15, 2024",
    status: "unpaid",
  },
  {
    id: "INV-2024-002",
    description: "Lab Fee - Semester 1",
    amount: 150,
    dueDate: "Dec 20, 2024",
    status: "unpaid",
  },
  {
    id: "INV-2023-012",
    description: "Tuition Fee - November 2024",
    amount: 450,
    dueDate: "Nov 15, 2024",
    status: "paid",
    paidOn: "Nov 12, 2024",
  },
]

export function FeeStatus() {
  const unpaidTotal = feeInvoices.filter((f) => f.status === "unpaid").reduce((sum, f) => sum + f.amount, 0)

  return (
    <Card className="border-0 shadow-lg shadow-primary/5">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Fee Status</CardTitle>
        <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
          <CreditCard className="h-4 w-4 mr-1" />
          Pay Now (${unpaidTotal})
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {feeInvoices.map((invoice) => (
          <div
            key={invoice.id}
            className={`p-4 rounded-xl border ${
              invoice.status === "unpaid"
                ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/50"
                : "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {invoice.status === "unpaid" ? (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  )}
                  <span className="font-medium text-sm">{invoice.description}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">
                  {invoice.status === "unpaid" ? `Due: ${invoice.dueDate}` : `Paid on: ${invoice.paidOn}`}
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">${invoice.amount}</p>
                <Badge variant={invoice.status === "unpaid" ? "secondary" : "default"} className="text-xs">
                  {invoice.status === "unpaid" ? "Pending" : "Paid"}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
