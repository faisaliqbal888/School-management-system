"use client"

import { useRequireRole } from "@/lib/auth-context"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { FeeCollectionStats } from "@/components/fees/fee-collection-stats"
import { InvoiceTable } from "@/components/fees/invoice-table"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { useFeesSummary, useInvoices } from "@/lib/hooks/use-fees"

export default function StudentFeesPage() {
  const { ready } = useRequireRole("STUDENT")

  const summaryQ = useFeesSummary(ready)
  const invoicesQ = useInvoices({ page: 1, limit: 50 })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <StudentHeader />
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Fees &amp; Payments</h1>
            <p className="text-muted-foreground">
              Your invoices, receipts and outstanding dues in one place
            </p>
          </div>

          {summaryQ.error && (
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="flex items-center gap-2 p-4 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {summaryQ.error}
              </CardContent>
            </Card>
          )}

          <FeeCollectionStats summary={summaryQ.summary} isLoading={summaryQ.isLoading} compact />

          <div>
            <h2 className="mb-3 text-sm font-semibold text-muted-foreground">My invoices</h2>
            <InvoiceTable
              invoices={invoicesQ.invoices}
              isLoading={invoicesQ.isLoading}
              error={invoicesQ.error}
              hideStudent
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Payments are recorded by the school accounts office. If a payment is missing, contact
            the front office with your receipt number.
          </p>
        </main>
      </div>
    </div>
  )
}
