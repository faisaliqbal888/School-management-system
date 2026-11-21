"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import { usePayrollMutations, useLeaveMutations } from "@/lib/hooks/use-operations"
import { useStaffDirectory } from "@/lib/hooks/use-admin"
import { leaveSchema, type LeaveValues } from "@/lib/validation/schemas"

function rootErrorOf(form: { formState: { errors: { root?: { message?: string } } } }) {
  return form.formState.errors.root?.message
}

/**
 * Leave is recorded against a teacher or a staff member. The directory returns
 * both with a `type`, which is what lets one select feed the right FK.
 */
export function LeaveDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { create } = useLeaveMutations(onSaved)
  const { staff } = useStaffDirectory()

  const form = useForm<LeaveValues>({
    resolver: zodResolver(leaveSchema),
    defaultValues: {
      subject: "",
      fromDate: new Date().toISOString().slice(0, 10),
      toDate: new Date().toISOString().slice(0, 10),
      reason: "",
    },
  })

  useEffect(() => {
    if (!open) return
    const today = new Date().toISOString().slice(0, 10)
    form.reset({ subject: "", fromDate: today, toDate: today, reason: "" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const submit = form.handleSubmit(async (values) => {
    // `subject` is `<type>:<id>` so one field carries both the FK and its kind.
    const [kind, id] = values.subject.split(":")
    try {
      await create.mutate({
        teacherId: kind === "teacher" ? id : null,
        staffId: kind === "staff" ? id : null,
        fromDate: values.fromDate,
        toDate: values.toDate,
        reason: values.reason,
      })
      toast.success("Leave request recorded")
      onOpenChange(false)
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Could not save the request" })
    }
  })

  const rootError = rootErrorOf(form)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record leave</DialogTitle>
          <DialogDescription>New requests start as pending and need a decision.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <Label>Who</Label>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staff.map((person) => (
                      <SelectItem key={`${person.type}:${person.id}`} value={`${person.type}:${person.id}`}>
                        {person.name} · {person.type === "teacher" ? "Teacher" : "Staff"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="fromDate"
              render={({ field }) => (
                <FormItem>
                  <Label>From</Label>
                  <Input type="date" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="toDate"
              render={({ field }) => (
                <FormItem>
                  <Label>To</Label>
                  <Input type="date" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <Label>Reason</Label>
                <Input placeholder="Family event" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record leave
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
//  Payroll run
// ─────────────────────────────────────────────────────────────

export function PayrollRunDialog({
  open,
  onOpenChange,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved?: () => void
}) {
  const { run } = usePayrollMutations(onSaved)
  const [period, setPeriod] = useState(() => new Date().toISOString().slice(0, 7))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPeriod(new Date().toISOString().slice(0, 7))
      setError(null)
    }
  }, [open])

  async function submit() {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
      setError("Pick a valid month")
      return
    }
    try {
      const result = await run.mutate(period)
      toast.success(`Payroll drafted for ${period}`, {
        description:
          result.created > 0
            ? `${result.created} new row(s), ${result.skipped} already existed`
            : "Every active staff member already had a row — nothing was overwritten",
      })
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not run payroll")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Run payroll</DialogTitle>
          <DialogDescription>
            Drafts a row per active staff member from their current salary. Re-running is safe: existing
            rows are never overwritten.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="payroll-period">Period</Label>
            <Input
              id="payroll-period"
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={run.isPending}>
            {run.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
