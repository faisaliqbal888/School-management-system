"use client"

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
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { Invoice } from "./invoice-table"
import { CreditCard, Banknote, Building2, Smartphone } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

interface RecordPaymentModalProps {
  invoice: Invoice | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const paymentMethods = [
  { id: "cash", name: "Cash", icon: Banknote },
  { id: "card", name: "Card", icon: CreditCard },
  { id: "bank", name: "Bank Transfer", icon: Building2 },
  { id: "online", name: "Online", icon: Smartphone },
]

export function RecordPaymentModal({ invoice, open, onOpenChange }: RecordPaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState("cash")

  if (!invoice) return null

  const balance = invoice.totalAmount - invoice.paidAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Record Payment</DialogTitle>
          <DialogDescription>Record a payment for invoice {invoice.invoiceNo}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Student Info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
            <Avatar className="h-12 w-12">
              <AvatarImage src={invoice.studentAvatar || "/placeholder.svg"} alt={invoice.studentName} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {invoice.studentName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{invoice.studentName}</p>
              <p className="text-sm text-muted-foreground">Class {invoice.class}</p>
            </div>
          </div>

          {/* Invoice Summary */}
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Amount</span>
                <span className="font-medium">${invoice.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Already Paid</span>
                <span className="font-medium text-success">${invoice.paidAmount.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-medium">Balance Due</span>
                <span className="font-bold text-lg text-primary">${balance.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <Button
                  key={method.id}
                  variant="outline"
                  className={cn(
                    "h-auto flex-col gap-2 py-4 transition-all",
                    selectedMethod === method.id && "border-primary bg-primary/5 text-primary",
                  )}
                  onClick={() => setSelectedMethod(method.id)}
                >
                  <method.icon className="h-5 w-5" />
                  <span className="text-xs">{method.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Payment Amount */}
          <div className="space-y-2">
            <Label>Payment Amount</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <Input type="number" defaultValue={balance} className="pl-7 text-lg font-semibold" />
            </div>
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label>Reference / Transaction ID (Optional)</Label>
            <Input placeholder="Enter reference number" />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onOpenChange(false)} className="gap-2">
            <CreditCard className="h-4 w-4" />
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
