"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Loader2, ReceiptText } from "lucide-react"
import { formatPKR } from "@/lib/format"
import { useCreateInvoice, useFeeStructures, currentPeriod } from "@/lib/hooks/use-fees"
import { useStudents } from "@/lib/hooks/use-students"

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

  const [studentId, setStudentId] = useState("")
  const [structureId, setStructureId] = useState("")
  const [title, setTitle] = useState("")
  const [amount, setAmount] = useState("")
  const [discount, setDiscount] = useState("0")
  const [fine, setFine] = useState("0")
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 10)
    return d.toISOString().slice(0, 10)
  })
  const [period, setPeriod] = useState(currentPeriod())
  const [notes, setNotes] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setStudentId(presetStudentId ?? "")
    setStructureId("")
    setTitle("")
    setAmount("")
    setDiscount("0")
    setFine("0")
    setPeriod(currentPeriod())
    setNotes("")
    setError("")
  }, [open, presetStudentId])

  // selecting a structure pre-fills title + amount
  useEffect(() => {
    if (!structureId) return
    const structure = structures.find((s) => s.id === structureId)
    if (structure) {
      setTitle(structure.name)
      setAmount(String(structure.amount))
      const day = Math.min(structure.dueDay, 28)
      const [y, m] = period.split("-").map(Number)
      setDueDate(new Date(Date.UTC(y!, m! - 1, day)).toISOString().slice(0, 10))
    }
  }, [structureId, structures]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = useMemo(() => {
    const base = Number(amount) || 0
    return base - (Number(discount) || 0) + (Number(fine) || 0)
  }, [amount, discount, fine])

  const handleSubmit = async () => {
    if (!studentId) return setError("Please choose a student")
    if (!title.trim()) return setError("Please enter an invoice title")
    if (!(Number(amount) > 0)) return setError("Amount must be greater than zero")
    if (Number(discount) > Number(amount)) return setError("Discount cannot exceed the amount")
    if (total <= 0) return setError("Invoice total must be greater than zero")

    setError("")
    setSaving(true)
    try {
      const res = await createInvoice({
        studentId,
        title: title.trim(),
        amount: Number(amount),
        discount: Number(discount) || 0,
        fine: Number(fine) || 0,
        dueDate,
        period: period || null,
        notes: notes.trim() || null,
        feeStructureId: structureId || null,
      })
      toast.success(`Invoice ${res.invoiceNo} created`, {
        description: `${formatPKR(res.totalAmount)} due · ${period}`,
      })
      onCreated?.()
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the invoice")
    } finally {
      setSaving(false)
    }
  }

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

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={studentsLoading}>
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
          </div>

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

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              placeholder="e.g. Tuition Fee — November"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount (PKR)</Label>
              <Input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <Input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Discount (PKR)</Label>
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Fine (PKR)</Label>
              <Input type="number" min={0} value={fine} onChange={(e) => setFine(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Input
              placeholder="Anything the accounts team should know"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Invoice total</span>
            <span className="text-lg font-bold">{formatPKR(total)}</span>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Creating…" : "Create Invoice"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
