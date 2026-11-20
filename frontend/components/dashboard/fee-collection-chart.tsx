"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { money, type FeePosition } from "@/lib/hooks/use-dashboard"

interface Props {
  fees: FeePosition | null | undefined
  title?: string
  className?: string
}

export function FeeCollectionChart({ fees, title, className }: Props) {
  const hasInvoices = (fees?.invoiceCount ?? 0) > 0

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{title ?? "Fee collection"}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {hasInvoices ? `${fees?.invoiceCount} invoices raised` : "No invoices raised yet"}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {!hasInvoices ? (
          <div className="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
            Nothing has been billed yet.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border bg-emerald-50/50 p-3">
                <p className="text-xs text-muted-foreground">Collected</p>
                <p className="text-xl font-bold text-emerald-700">PKR {money(fees?.paid ?? 0)}</p>
                <p className="text-[11px] text-muted-foreground">
                  PKR {money(fees?.collectedThisMonth ?? 0)} this month
                </p>
              </div>
              <div className="rounded-lg border bg-rose-50/50 p-3">
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-rose-700">PKR {money(fees?.outstanding ?? 0)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {fees?.overdue ?? 0} overdue · {fees?.pending ?? 0} pending
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Collection rate</span>
                <span className="font-semibold">{fees?.collectionRate ?? 0}%</span>
              </div>
              <Progress value={fees?.collectionRate ?? 0} className="h-2" />
              <p className="text-xs text-muted-foreground">
                PKR {money(fees?.paid ?? 0)} collected of PKR {money(fees?.billed ?? 0)} billed
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
