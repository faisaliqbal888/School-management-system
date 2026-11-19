"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  ReceiptText,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { formatPKR, formatPKRCompact } from "@/lib/format"
import type { FeesSummary } from "@/lib/hooks/use-fees"
import { cn } from "@/lib/utils"

interface FeeCollectionStatsProps {
  summary: FeesSummary | undefined
  isLoading: boolean
  /** Hide the invoice breakdown (student/parent views only need the rate). */
  compact?: boolean
}

export function FeeCollectionStats({ summary, isLoading, compact = false }: FeeCollectionStatsProps) {
  if (isLoading || !summary) {
    return (
      <div className={cn("grid gap-4", compact ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4")}>
        {Array.from({ length: compact ? 3 : 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    )
  }

  const cards = [
    {
      title: "Total billed",
      value: formatPKR(summary.billed),
      hint: `${summary.invoices.total} invoice${summary.invoices.total === 1 ? "" : "s"}`,
      icon: ReceiptText,
      tone: "from-blue-500 to-blue-600",
      bg: "from-blue-50 to-blue-100",
    },
    {
      title: "Collected",
      value: formatPKR(summary.paid),
      hint: `${formatPKRCompact(summary.collectedThisMonth)} this month`,
      icon: Wallet,
      tone: "from-emerald-500 to-emerald-600",
      bg: "from-emerald-50 to-emerald-100",
    },
    {
      title: "Outstanding",
      value: formatPKR(summary.outstanding),
      hint:
        summary.invoices.overdue > 0
          ? `${summary.invoices.overdue} overdue invoice${summary.invoices.overdue === 1 ? "" : "s"}`
          : "Nothing overdue",
      icon: AlertCircle,
      tone: "from-red-500 to-red-600",
      bg: "from-red-50 to-red-100",
    },
    {
      title: "Collection rate",
      value: summary.collectionRate !== null ? `${summary.collectionRate}%` : "—",
      hint:
        summary.collectionRate !== null && summary.collectionRate >= 90
          ? "Healthy"
          : "Follow up on dues",
      icon: TrendingUp,
      tone: "from-violet-500 to-purple-600",
      bg: "from-violet-50 to-violet-100",
    },
  ]

  return (
    <div className="space-y-4">
      <div className={cn("grid gap-4", compact ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4")}>
        {(compact ? cards.slice(1) : cards).map((c) => (
          <Card key={c.title} className={cn("border-0 bg-gradient-to-br shadow-md", c.bg)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
                    {c.title}
                  </p>
                  <p className="mt-1.5 text-2xl font-bold text-gray-900">{c.value}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.hint}</p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow",
                    c.tone,
                  )}
                >
                  <c.icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!compact && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Collection progress</CardTitle>
            <p className="text-xs text-muted-foreground">
              {formatPKR(summary.paid)} of {formatPKR(summary.billed)} billed
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={summary.collectionRate ?? 0} className="h-3" />

            <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
              <StatusTile
                label="Paid"
                value={summary.invoices.paid}
                icon={CheckCircle2}
                tone="text-emerald-600"
              />
              <StatusTile
                label="Partial"
                value={summary.invoices.partial}
                icon={CreditCard}
                tone="text-blue-600"
              />
              <StatusTile
                label="Pending"
                value={summary.invoices.pending}
                icon={Clock}
                tone="text-amber-600"
              />
              <StatusTile
                label="Overdue"
                value={summary.invoices.overdue}
                icon={AlertCircle}
                tone="text-red-600"
              />
              <StatusTile
                label="Waived"
                value={summary.invoices.waived}
                icon={ReceiptText}
                tone="text-violet-600"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ElementType
  tone: string
}) {
  return (
    <div className="rounded-lg border border-border p-2.5">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", tone)} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-0.5 text-lg font-bold">{value}</p>
    </div>
  )
}
