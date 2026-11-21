"use client"

import { useEffect } from "react"
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
import { useItemMutations } from "@/lib/hooks/use-operations"
import {
  itemSchema,
  ITEM_CONDITIONS,
  stockAdjustSchema,
  type ItemValues,
  type StockAdjustValues,
} from "@/lib/validation/schemas"

function rootErrorOf(form: { formState: { errors: { root?: { message?: string } } } }) {
  return form.formState.errors.root?.message
}

export interface ItemRow {
  id: string
  name: string
  code: string
  category: string
  quantity: number
  minQuantity: number
  unitPrice: number
  location: string | null
  supplier: string | null
  condition: string
}

export function ItemDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item?: ItemRow | null
  onSaved?: () => void
}) {
  const { create, update } = useItemMutations(onSaved)

  const form = useForm<ItemValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      name: "",
      code: "",
      category: "",
      quantity: 0,
      minQuantity: 0,
      unitPrice: 0,
      location: "",
      supplier: "",
      condition: "NEW",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: item?.name ?? "",
      code: item?.code ?? "",
      category: item?.category ?? "",
      quantity: item?.quantity ?? 0,
      minQuantity: item?.minQuantity ?? 0,
      unitPrice: item?.unitPrice ?? 0,
      location: item?.location ?? "",
      supplier: item?.supplier ?? "",
      condition: (item?.condition as ItemValues["condition"]) ?? "NEW",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  const submit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        location: values.location.trim() || null,
        supplier: values.supplier.trim() || null,
      }
      if (item) {
        await update.mutate({ id: item.id, ...payload })
        toast.success("Item updated")
      } else {
        await create.mutate(payload)
        toast.success("Item added")
      }
      onOpenChange(false)
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Could not save the item" })
    }
  })

  const rootError = rootErrorOf(form)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "Add item"}</DialogTitle>
          <DialogDescription>
            Use stock adjustments for day-to-day movements so each change carries a reason.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <Label>Name</Label>
                  <Input placeholder="Classroom chair" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <Label>Code</Label>
                  <Input placeholder="CH-001" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <Label>Category</Label>
                  <Input placeholder="Furniture" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <Label>Condition</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ITEM_CONDITIONS.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <Label>Quantity</Label>
                  <Input type="number" min={0} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minQuantity"
              render={({ field }) => (
                <FormItem>
                  <Label>Reorder level</Label>
                  <Input type="number" min={0} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitPrice"
              render={({ field }) => (
                <FormItem>
                  <Label>Unit price (PKR)</Label>
                  <Input type="number" min={0} step={50} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <Label>Location</Label>
                  <Input placeholder="Store room 2" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="supplier"
              render={({ field }) => (
                <FormItem>
                  <Label>Supplier</Label>
                  <Input {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {item ? "Save changes" : "Add item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
//  Stock adjustment
// ─────────────────────────────────────────────────────────────

export function StockAdjustDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: ItemRow | null
  onSaved?: () => void
}) {
  const { adjust } = useItemMutations(onSaved)

  const form = useForm<StockAdjustValues>({
    resolver: zodResolver(stockAdjustSchema),
    defaultValues: { delta: 1, reason: "" },
  })

  useEffect(() => {
    if (open) form.reset({ delta: 1, reason: "" })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item])

  if (!item) return null

  const submit = form.handleSubmit(async (values) => {
    try {
      const result = await adjust.mutate({ id: item.id, delta: values.delta, reason: values.reason })
      toast.success(`Stock now ${result.quantity}`, {
        description: result.lowStock ? "This is at or below the reorder level" : undefined,
      })
      onOpenChange(false)
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Could not adjust stock" })
    }
  })

  const rootError = rootErrorOf(form)
  const delta = Number(form.watch("delta")) || 0
  const projected = item.quantity + delta

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust stock — {item.name}</DialogTitle>
          <DialogDescription>
            Currently {item.quantity} in stock. Use a negative number to issue or write off.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <FormField
            control={form.control}
            name="delta"
            render={({ field }) => (
              <FormItem>
                <Label>Change</Label>
                <Input type="number" step={1} {...field} />
                <p className={projected < 0 ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
                  New quantity: {projected}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <Label>Reason</Label>
                <Input placeholder="Issued to room 4B" {...field} />
                <p className="text-xs text-muted-foreground">
                  Saved on the audit trail, so stock-take questions have an answer.
                </p>
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
            <Button type="submit" disabled={adjust.isPending}>
              {adjust.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
