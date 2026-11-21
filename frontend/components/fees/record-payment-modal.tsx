"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { CheckCircle2, Copy, Check, Loader2, Wallet } from "lucide-react"
import { formatPKR } from "@/lib/format"
import { useRecordPayment, type InvoiceRow, type PaymentMethod } from "@/lib/hooks/use-fees"
import { paymentSchema, type PaymentValues } from "@/lib/validation/schemas"

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

  const [saving, setSaving] = useState(false)
  const [receipt, setReceipt] = useState<{ receiptNo: string; amount: number; balance: number } | null>(null)
  const [copied, setCopied] = useState(false)

  const form = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: invoice?.balance ?? 0,
      method: "CASH",
      reference: "",
      notes: "",
    },
  })

  const method = form.watch("method")
  const numeric = Number(form.watch("amount")) || 0

  useEffect(() => {
    if (!open || !invoice) return
    form.reset({ amount: invoice.balance, method: "CASH", reference: "", notes: "" })
    setReceipt(null)
    setCopied(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice])

  if (!invoice) return null

  const handleSave = form.handleSubmit(async (values) => {
    // The cap depends on the invoice, so it cannot live in a static schema.
    if (values.amount > invoice.balance + 0.001) {
      form.setError("amount", {
        message: `Enter an amount between Rs 1 and ${formatPKR(invoice.balance)}`,
      })
      return
    }

    setSaving(true)
    try {
      const res = await recordPayment({
        invoiceId: invoice.id,
        amount: values.amount,
        method: values.method,
        reference: values.reference.trim() || null,
        notes: values.notes.trim() || null,
      })
      setReceipt({ receiptNo: res.receiptNo, amount: res.amount, balance: res.balance })
      toast.success(`Payment recorded · ${res.receiptNo}`, {
        description: `${formatPKR(res.amount)} received · balance ${formatPKR(res.balance)}`,
      })
      onRecorded?.()
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Could not record the payment",
      })
    } finally {
      setSaving(false)
    }
  })

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

            <form onSubmit={handleSave} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <Label>Amount received (PKR)</Label>
                    <Input type="number" min={1} max={invoice.balance} {...field} />
                    <div className="flex gap-2">
                      {[invoice.balance, Math.round(invoice.balance / 2)].map((preset, i) => (
                        <Button
                          key={i}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => form.setValue("amount", preset, { shouldValidate: true })}
                          className="text-xs"
                        >
                          {i === 0 ? "Full balance" : "Half"} · {formatPKR(preset)}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="method"
                render={({ field }) => (
                  <FormItem>
                    <Label>Method</Label>
                    <Select value={field.value} onValueChange={field.onChange}>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {method !== "CASH" && (
                <FormField
                  control={form.control}
                  name="reference"
                  render={({ field }) => (
                    <FormItem>
                      <Label>Reference</Label>
                      <Input
                        placeholder={method === "CHEQUE" ? "Cheque number" : "Transaction / slip ref"}
                        {...field}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <Label>Notes (optional)</Label>
                    <Input placeholder="e.g. Received by front office" {...field} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <Alert variant="destructive">
                  <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
                </Alert>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {saving ? "Recording…" : `Record ${formatPKR(numeric || 0)}`}
                </Button>
              </DialogFooter>
            </form>

          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
