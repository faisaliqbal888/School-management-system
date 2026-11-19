"use client"

import { useState } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2 } from "lucide-react"

interface CreateInvoiceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FeeItem {
  id: string
  name: string
  amount: number
}

export function CreateInvoiceModal({ open, onOpenChange }: CreateInvoiceModalProps) {
  const [feeItems, setFeeItems] = useState<FeeItem[]>([{ id: "1", name: "Tuition Fee", amount: 1500 }])

  const addFeeItem = () => {
    setFeeItems([...feeItems, { id: Date.now().toString(), name: "", amount: 0 }])
  }

  const removeFeeItem = (id: string) => {
    setFeeItems(feeItems.filter((item) => item.id !== id))
  }

  const updateFeeItem = (id: string, field: "name" | "amount", value: string | number) => {
    setFeeItems(feeItems.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const total = feeItems.reduce((sum, item) => sum + (item.amount || 0), 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Create Invoice</DialogTitle>
          <DialogDescription>Generate a new fee invoice for a student.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Student Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose student" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ali-khan">Ali Khan (8-A)</SelectItem>
                  <SelectItem value="sara-ahmed">Sara Ahmed (9-B)</SelectItem>
                  <SelectItem value="omar-hassan">Omar Hassan (7-C)</SelectItem>
                  <SelectItem value="fatima-ali">Fatima Ali (10-A)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" />
            </div>
          </div>

          {/* Fee Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Fee Items</Label>
              <Button variant="outline" size="sm" onClick={addFeeItem} className="gap-1 bg-transparent">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {feeItems.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    placeholder="Fee name"
                    value={item.name}
                    onChange={(e) => updateFeeItem(item.id, "name", e.target.value)}
                    className="flex-1"
                  />
                  <div className="relative w-32">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.amount || ""}
                      onChange={(e) => updateFeeItem(item.id, "amount", Number.parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                  {feeItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:text-destructive"
                      onClick={() => removeFeeItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <Card className="border-0 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Amount</span>
                <span className="text-2xl font-bold text-primary">${total.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Input placeholder="Add any additional notes..." />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)}>Create Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
