"use client"

import { useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { FeeCollectionStats } from "@/components/fees/fee-collection-stats"
import { InvoiceTable } from "@/components/fees/invoice-table"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, CreditCard, Loader2, Users } from "lucide-react"
import { useFeesSummary, useInvoices } from "@/lib/hooks/use-fees"
import { useStudents } from "@/lib/hooks/use-students"

export default function ParentFeesPage() {
  const { ready } = useRequireRole("PARENT")
  const { students, isLoading: childrenLoading } = useStudents({ limit: 20 })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const childId = selectedId ?? students[0]?.id ?? null
  const selected = students.find((s) => s.id === childId) ?? students[0]

  const summaryQ = useFeesSummary(ready)
  const invoicesQ = useInvoices({
    page: 1,
    limit: 50,
    ...(childId ? { studentId: childId } : {}),
  })

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Fees &amp; Payments</h1>
            <p className="mt-1 text-rose-100">
              Fee challans, payment history and outstanding dues for your children.
            </p>
          </div>

          {childrenLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <CreditCard className="h-7 w-7" />
                </div>
                <p className="max-w-sm text-sm text-muted-foreground">
                  No children are linked to this account yet. Please contact the school office.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {students.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {students.map((child) => (
                    <button key={child.id} type="button" onClick={() => setSelectedId(child.id)}>
                      <Badge
                        variant={child.id === childId ? "default" : "outline"}
                        className="cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-normal"
                      >
                        <Users className="h-3.5 w-3.5" />
                        {child.name}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                Showing fees for <span className="font-semibold text-foreground">{selected?.name}</span>
                {selected?.className ? ` · ${selected.className}` : ""}
                {selected?.sectionName ? `-${selected.sectionName}` : ""}
              </p>

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
                <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Invoices</h2>
                <InvoiceTable
                  invoices={invoicesQ.invoices}
                  isLoading={invoicesQ.isLoading}
                  error={invoicesQ.error}
                  hideStudent
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Payments are recorded by the school accounts office. If a payment is missing,
                contact the front office with your receipt number.
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
