"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CheckCircle2, Copy, Check, Loader2, Wallet } from "lucide-react"
import { formatPKR } from "@/lib/format"
import { useRecordPayment, type InvoiceRow, type PaymentMethod } from "@/lib/hooks/use-fees"

interface RecordPaymentModalProps {
  invoice: InvoiceRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRecorded?: () => void
}

const METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "CARD", label: "Card" },
  { value: "ONLINE", label: "Online" },
  { value: "CHEQUE", label: "Cheque" },
]

export function RecordPaymentModal({
  invoice,
  open,
  onOpenChange,
  onRecorded,
}: RecordPaymentModalProps) {
  const recordPayment = useRecordPayment()

  const [amount, setAmount] = useState("")
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [reference, setReference] = useState("")
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState<{ receiptNo: string; amount: number; balance: number } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open || !invoice) return
    setAmount(String(invoice.balance))
    setMethod("CASH")
    setReference("")
    setNotes("")
    setError("")
    setReceipt(null)
    setCopied(false)
  }, [open, invoice])

  if (!invoice) return null

  const numeric = Number(amount)
  const valid = Number.isFinite(numeric) && numeric > 0 && numeric <= invoice.balance + 0.001

  const handleSave = async () => {
    if (!valid) {
      setError(`Enter an amount between Rs 1 and ${formatPKR(invoice.balance)}`)
      return
    }

    setError("")
    setSaving(true)
    try {
      const res = await recordPayment({
        invoiceId: invoice.id,
        amount: numeric,
        method,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
      })
      setReceipt({ receiptNo: res.receiptNo, amount: res.amount, balance: res.balance })
      toast.success(`Payment recorded · ${res.receiptNo}`, {
        description: `${formatPKR(res.amount)} received · balance ${formatPKR(res.balance)}`,
      })
      onRecorded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record the payment")
    } finally {
      setSaving(false)
    }
  }

  const copyReceipt = async () => {
    if (!receipt) return
    await navigator.clipboard.writeText(
      `Receipt ${receipt.receiptNo}\nInvoice: ${invoice.invoiceNo}\nStudent: ${invoice.studentName}\nAmount: ${formatPKR(receipt.amount)}\nRemaining balance: ${formatPKR(receipt.balance)}`,
    )
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {receipt ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </div>
              <DialogTitle className="text-center">Payment received</DialogTitle>
              <DialogDescription className="text-center">
                Give this receipt number to the family for their records.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-2 text-sm">
              <div className="flex justify-between rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-muted-foreground">Receipt</span>
                <span className="font-mono font-medium">{receipt.receiptNo}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatPKR(receipt.amount)}</span>
              </div>
              <div className="flex justify-between rounded-lg border border-border bg-muted/40 p-3">
                <span className="text-muted-foreground">Remaining balance</span>
                <span className="font-medium">{formatPKR(receipt.balance)}</span>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => void copyReceipt()} className="gap-2">
                {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={() => onOpenChange(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mb-1 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Wallet className="h-4 w-4" />
                </div>
                <div>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription className="text-xs">
                    {invoice.invoiceNo} · {invoice.studentName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice total</span>
                <span>{formatPKR(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Already paid</span>
                <span className="text-emerald-700">{formatPKR(invoice.paidAmount)}</span>
              </div>
              <Separator className="my-1" />
              <div className="flex justify-between font-semibold">
                <span>Balance due</span>
                <span>{formatPKR(invoice.balance)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Amount received (PKR)</Label>
                <Input
                  type="number"
                  min={1}
                  max={invoice.balance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <div className="flex gap-2">
                  {[invoice.balance, Math.round(invoice.balance / 2)].map((preset, i) => (
                    <Button
                      key={i}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(String(preset))}
                      className="text-xs"
                    >
                      {i === 0 ? "Full balance" : "Half"} · {formatPKR(preset)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {METHODS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {method !== "CASH" && (
                <div className="space-y-2">
                  <Label>Reference</Label>
                  <Input
                    placeholder={method === "CHEQUE" ? "Cheque number" : "Transaction / slip ref"}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Input
                  placeholder="e.g. Received by front office"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={() => void handleSave()} disabled={saving || !valid}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {saving ? "Recording…" : `Record ${formatPKR(numeric || 0)}`}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
