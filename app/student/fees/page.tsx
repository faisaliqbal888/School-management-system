"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { StudentSidebar } from "@/components/student/student-sidebar"
import { StudentHeader } from "@/components/student/student-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, CreditCard, CheckCircle2, AlertCircle, Download, Receipt } from "lucide-react"

const invoices = [
  {
    id: "INV-2024-001",
    description: "Tuition Fee - December 2024",
    items: [
      { name: "Monthly Tuition", amount: 400 },
      { name: "Lab Fee", amount: 50 },
    ],
    total: 450,
    dueDate: "Dec 15, 2024",
    status: "unpaid",
  },
  {
    id: "INV-2024-002",
    description: "Transport Fee - Q4 2024",
    items: [{ name: "Bus Service", amount: 150 }],
    total: 150,
    dueDate: "Dec 20, 2024",
    status: "unpaid",
  },
  {
    id: "INV-2023-012",
    description: "Tuition Fee - November 2024",
    items: [
      { name: "Monthly Tuition", amount: 400 },
      { name: "Lab Fee", amount: 50 },
    ],
    total: 450,
    dueDate: "Nov 15, 2024",
    status: "paid",
    paidOn: "Nov 12, 2024",
    transactionId: "TXN-8839201",
  },
  {
    id: "INV-2023-011",
    description: "Tuition Fee - October 2024",
    items: [
      { name: "Monthly Tuition", amount: 400 },
      { name: "Lab Fee", amount: 50 },
    ],
    total: 450,
    dueDate: "Oct 15, 2024",
    status: "paid",
    paidOn: "Oct 10, 2024",
    transactionId: "TXN-7782910",
  },
]

export default function StudentFeesPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const [processingPayment, setProcessingPayment] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "student")) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  const handlePayment = async (invoiceId: string) => {
    setProcessingPayment(invoiceId)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setProcessingPayment(null)
    alert("Payment gateway would open here. This is a demo.")
  }

  if (isLoading || !isAuthenticated || user?.role !== "student") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const unpaidTotal = invoices.filter((i) => i.status === "unpaid").reduce((sum, i) => sum + i.total, 0)
  const paidTotal = invoices.filter((i) => i.status === "paid").reduce((sum, i) => sum + i.total, 0)

  return (
    <div className="min-h-screen bg-background">
      <StudentSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <StudentHeader />
        <main className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Fee & Payments</h1>
              <p className="text-muted-foreground">View invoices and make payments</p>
            </div>
            {unpaidTotal > 0 && (
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                <CreditCard className="h-5 w-5 mr-2" />
                Pay All Pending (${unpaidTotal})
              </Button>
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-0 shadow-md border-l-4 border-l-amber-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Amount</p>
                    <p className="text-2xl font-bold text-amber-600">${unpaidTotal}</p>
                  </div>
                  <AlertCircle className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md border-l-4 border-l-emerald-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Paid This Year</p>
                    <p className="text-2xl font-bold text-emerald-600">${paidTotal}</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Next Due Date</p>
                    <p className="text-2xl font-bold">Dec 15</p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className={`p-4 rounded-xl border ${
                    invoice.status === "unpaid"
                      ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/30"
                      : "border-border bg-muted/30"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{invoice.description}</h4>
                        <Badge variant={invoice.status === "unpaid" ? "secondary" : "default"}>
                          {invoice.status === "unpaid" ? "Pending" : "Paid"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">Invoice: {invoice.id}</p>
                      <div className="text-sm text-muted-foreground">
                        {invoice.status === "unpaid"
                          ? `Due: ${invoice.dueDate}`
                          : `Paid on: ${invoice.paidOn} | Txn: ${invoice.transactionId}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold">${invoice.total}</p>
                      </div>
                      {invoice.status === "unpaid" ? (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="bg-gradient-to-r from-blue-500 to-cyan-500">Pay Now</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Payment Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 rounded-lg bg-muted">
                                <p className="font-medium mb-2">{invoice.description}</p>
                                {invoice.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span>${item.amount}</span>
                                  </div>
                                ))}
                                <div className="border-t mt-2 pt-2 flex justify-between font-bold">
                                  <span>Total</span>
                                  <span>${invoice.total}</span>
                                </div>
                              </div>
                              <Button
                                className="w-full"
                                onClick={() => handlePayment(invoice.id)}
                                disabled={processingPayment === invoice.id}
                              >
                                {processingPayment === invoice.id ? (
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                  <CreditCard className="h-4 w-4 mr-2" />
                                )}
                                {processingPayment === invoice.id ? "Processing..." : "Proceed to Payment"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
