"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Loader2, ReceiptText } from "lucide-react"
import { formatPKR } from "@/lib/format"
import { useCreateInvoice, useFeeStructures, currentPeriod } from "@/lib/hooks/use-fees"
import { useStudents } from "@/lib/hooks/use-students"
import { invoiceSchema, type InvoiceValues } from "@/lib/validation/schemas"

interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  /** Pre-fills the student when opened from a student row. */
  presetStudentId?: string | null
}

export function CreateInvoiceModal({
  open,
  onOpenChange,
  onCreated,
  presetStudentId,
}: CreateInvoiceModalProps) {
  const createInvoice = useCreateInvoice()
  const { students, isLoading: studentsLoading } = useStudents({ limit: 100, page: 1 })
  const { structures } = useFeeStructures(open)

  const [structureId, setStructureId] = useState("")
  const [saving, setSaving] = useState(false)

  const inTenDays = () => {
    const d = new Date()
    d.setDate(d.getDate() + 10)
    return d.toISOString().slice(0, 10)
  }

  const emptyValues = (): InvoiceValues => ({
    studentId: presetStudentId ?? "",
    title: "",
    amount: 0,
    discount: 0,
    fine: 0,
    dueDate: inTenDays(),
    period: currentPeriod(),
    notes: "",
    feeStructureId: "",
  })

  const form = useForm<InvoiceValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: emptyValues(),
  })

  const [amount, discount, fine, period] = form.watch(["amount", "discount", "fine", "period"])

  useEffect(() => {
    if (!open) return
    setStructureId("")
    form.reset(emptyValues())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, presetStudentId])

  // selecting a structure pre-fills title + amount + due date
  useEffect(() => {
    if (!structureId) return
    const structure = structures.find((s) => s.id === structureId)
    if (structure) {
      form.setValue("title", structure.name)
      form.setValue("amount", structure.amount, { shouldValidate: true })
      form.setValue("feeStructureId", structure.id)
      const day = Math.min(structure.dueDay, 28)
      const [y, m] = period.split("-").map(Number)
      form.setValue("dueDate", new Date(Date.UTC(y!, m! - 1, day)).toISOString().slice(0, 10))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [structureId, structures])

  const total = useMemo(
    () => (Number(amount) || 0) - (Number(discount) || 0) + (Number(fine) || 0),
    [amount, discount, fine],
  )

  const handleSubmit = form.handleSubmit(async (values) => {
    setSaving(true)
    try {
      const res = await createInvoice({
        studentId: values.studentId,
        title: values.title,
        amount: values.amount,
        discount: values.discount || 0,
        fine: values.fine || 0,
        dueDate: values.dueDate,
        period: values.period || null,
        notes: values.notes.trim() || null,
        feeStructureId: structureId || null,
      })
      toast.success(`Invoice ${res.invoiceNo} created`, {
        description: `${formatPKR(res.totalAmount)} due · ${values.period}`,
      })
      onCreated?.()
      onOpenChange(false)
    } catch (err) {
      form.setError("root", {
        message: err instanceof Error ? err.message : "Could not create the invoice",
      })
    } finally {
      setSaving(false)
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <ReceiptText className="h-4 w-4" />
            </div>
            <div>
              <DialogTitle>Raise Invoice</DialogTitle>
              <DialogDescription className="text-xs">
                The invoice number is generated automatically
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <Label>Student</Label>
                <Select value={field.value} onValueChange={field.onChange} disabled={studentsLoading}>
                  <SelectTrigger>
                    <SelectValue placeholder={studentsLoading ? "Loading…" : "Choose a student"} />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} · {s.admissionNo}
                        {s.className ? ` · ${s.className}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>Fee structure (optional)</Label>
            <Select value={structureId} onValueChange={setStructureId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a predefined fee" />
              </SelectTrigger>
              <SelectContent>
                {structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.className} · {s.name} · {formatPKR(s.amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <Label>Title</Label>
                <Input placeholder="e.g. Tuition Fee — November" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <Label>Amount (PKR)</Label>
                  <Input type="number" min={0} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <Label>Period</Label>
                  <Input type="month" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <Label>Discount (PKR)</Label>
                  <Input type="number" min={0} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fine"
              render={({ field }) => (
                <FormItem>
                  <Label>Fine (PKR)</Label>
                  <Input type="number" min={0} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <Label>Due date</Label>
                  <Input type="date" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <Label>Notes (optional)</Label>
                <Input placeholder="Anything the accounts team should know" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Invoice total</span>
            <span className="text-lg font-bold">{formatPKR(total)}</span>
          </div>

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
              {saving ? "Creating…" : "Create Invoice"}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  )
}
