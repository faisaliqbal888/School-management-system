"use client"

import { useMemo, useState } from "react"
import { useRequireRole } from "@/lib/auth-context"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { FeeCollectionStats } from "@/components/fees/fee-collection-stats"
import { InvoiceTable } from "@/components/fees/invoice-table"
import { CreateInvoiceModal } from "@/components/fees/create-invoice-modal"
import { RecordPaymentModal } from "@/components/fees/record-payment-modal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Plus,
  Receipt,
  Search,
  Wallet,
} from "lucide-react"
import {
  useFeesSummary,
  useFeeStructures,
  useGenerateInvoices,
  useInvoices,
  usePayments,
  currentPeriod,
  type InvoiceFilters,
  type InvoiceRow,
  type InvoiceStatus,
} from "@/lib/hooks/use-fees"
import { formatDate, formatPKR } from "@/lib/format"
import { cn } from "@/lib/utils"

const STATUS_OPTIONS: (InvoiceStatus | "all")[] = [
  "all",
  "PENDING",
  "PARTIAL",
  "OVERDUE",
  "PAID",
  "WAIVED",
  "CANCELLED",
]

export default function AdminFeesPage() {
  const { ready } = useRequireRole("ADMIN")

  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<InvoiceStatus | "all">("all")
  const [period, setPeriod] = useState("")
  const [page, setPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null)

  const summaryQ = useFeesSummary(ready)

  const filters: InvoiceFilters = useMemo(
    () => ({
      page,
      limit: 10,
      ...(search ? { search } : {}),
      ...(status !== "all" ? { status } : {}),
      ...(period ? { period } : {}),
    }),
    [page, search, status, period],
  )

  const invoicesQ = useInvoices(filters)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const refresh = () => {
    invoicesQ.refetch()
    summaryQ.refetch()
  }

  const openPayment = (invoice: InvoiceRow) => {
    setSelectedInvoice(invoice)
    setPaymentOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/20">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-col gap-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 p-6 text-white shadow-lg sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Fees &amp; Payments</h1>
              <p className="mt-1 text-indigo-100">
                Raise invoices, collect payments and track outstanding dues
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setCreateOpen(true)}
              className="w-fit gap-2"
            >
              <Plus className="h-4 w-4" />
              Raise Invoice
            </Button>
          </div>

          <FeeCollectionStats summary={summaryQ.summary} isLoading={summaryQ.isLoading} />

          <Tabs defaultValue="invoices" className="space-y-5">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="structures">Fee Structures</TabsTrigger>
            </TabsList>

            {/* INVOICES */}
            <TabsContent value="invoices" className="space-y-4">
              <Card>
                <CardContent className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search invoice no, student or title…"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value)
                        setPage(1)
                      }}
                      className="pl-9"
                    />
                  </div>
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v as InvoiceStatus | "all")
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-full lg:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s === "all" ? "All statuses" : s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="month"
                    value={period}
                    onChange={(e) => {
                      setPeriod(e.target.value)
                      setPage(1)
                    }}
                    className="w-full lg:w-44"
                  />
                </CardContent>
              </Card>

              <InvoiceTable
                invoices={invoicesQ.invoices}
                isLoading={invoicesQ.isLoading}
                error={invoicesQ.error}
                canRecordPayment
                onRecordPayment={openPayment}
              />

              <Pagination
                page={page}
                totalPages={invoicesQ.meta?.totalPages ?? 1}
                total={invoicesQ.meta?.total ?? 0}
                onPageChange={setPage}
                isLoading={invoicesQ.isLoading}
                label="invoices"
              />
            </TabsContent>

            {/* PAYMENTS */}
            <TabsContent value="payments">
              <PaymentsTab />
            </TabsContent>

            {/* STRUCTURES */}
            <TabsContent value="structures">
              <StructuresTab />
            </TabsContent>
          </Tabs>

          <CreateInvoiceModal open={createOpen} onOpenChange={setCreateOpen} onCreated={refresh} />
          <RecordPaymentModal
            invoice={selectedInvoice}
            open={paymentOpen}
            onOpenChange={setPaymentOpen}
            onRecorded={refresh}
          />
        </main>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────

function PaymentsTab() {
  const [page, setPage] = useState(1)
  const { payments, meta, isLoading, error } = usePayments({ page, limit: 10 })

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
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

  if (payments.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-medium">No payments recorded yet</p>
          <p className="text-sm text-muted-foreground">
            Record a payment against an invoice to see receipts here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Paid on</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{p.receiptNo}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.studentName}</p>
                    <p className="text-xs text-muted-foreground">{p.admissionNo}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs">{p.invoiceNo}</p>
                    <p className="text-xs text-muted-foreground">{p.invoiceTitle}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">
                      {p.method.replace("_", " ")}
                    </Badge>
                    {p.reference && (
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        {p.reference}
                      </p>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-emerald-700">
                    {formatPKR(p.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatDate(p.paidAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Pagination
        page={page}
        totalPages={meta?.totalPages ?? 1}
        total={meta?.total ?? 0}
        onPageChange={setPage}
        isLoading={isLoading}
        label="payments"
      />
    </div>
  )
}

function StructuresTab() {
  const { structures, isLoading, error, refetch } = useFeeStructures()
  const generate = useGenerateInvoices()
  const [generating, setGenerating] = useState<string | null>(null)

  const handleGenerate = async (structureId: string, name: string) => {
    const period = currentPeriod()
    setGenerating(structureId)
    try {
      const res = await generate({ feeStructureId: structureId, period })
      toast.success(
        res.created > 0
          ? `Created ${res.created} invoice${res.created === 1 ? "" : "s"} for ${period}`
          : `All invoices already exist for ${period}`,
        { description: `${name} · ${res.skipped} skipped` },
      )
      refetch()
    } catch (err) {
      toast.error("Could not generate invoices", {
        description: err instanceof Error ? err.message : "Unknown error",
      })
    } finally {
      setGenerating(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="space-y-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
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

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <Layers className="h-4 w-4 text-primary" />
        <CardTitle className="text-base">Fee structures</CardTitle>
        <span className="ml-auto text-xs text-muted-foreground">{structures.length} defined</span>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Class</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Frequency</th>
                <th className="px-4 py-3 font-medium">Due day</th>
                <th className="px-4 py-3 text-right font-medium">Invoices</th>
                <th className="px-4 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {structures.map((s) => (
                <tr key={s.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    {s.subjectName && (
                      <p className="text-xs text-muted-foreground">{s.subjectName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.className}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-medium">
                    {formatPKR(s.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-[10px]">
                      {s.frequency.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.dueDay}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{s.invoiceCount}</td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={generating === s.id}
                      onClick={() => void handleGenerate(s.id, s.name)}
                    >
                      {generating === s.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Receipt className="h-3.5 w-3.5" />
                      )}
                      Generate
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

function Pagination({
  page,
  totalPages,
  total,
  onPageChange,
  isLoading,
  label,
}: {
  page: number
  totalPages: number
  total: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  label: string
}) {
  if (total === 0) return null

  return (
    <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:flex-row">
      <p className="text-sm text-gray-600">
        <span className="font-medium">{total.toLocaleString("en-PK")}</span> {label} · page{" "}
        {page} of {totalPages}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1 || isLoading}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || isLoading}
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
