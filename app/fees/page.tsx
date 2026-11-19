"use client"

import { useState } from "react"
import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { InvoiceTable, type Invoice } from "@/components/fees/invoice-table"
import { CreateInvoiceModal } from "@/components/fees/create-invoice-modal"
import { RecordPaymentModal } from "@/components/fees/record-payment-modal"
import { FeeCollectionStats } from "@/components/fees/fee-collection-stats"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, TrendingUp, Clock, AlertTriangle, Search, Plus, Download, Send } from "lucide-react"

const stats = [
  {
    title: "Total Collected",
    value: "$284,500",
    change: "+12.5%",
    icon: DollarSign,
    color: "from-emerald-500 to-emerald-600",
    bgGradient: "from-emerald-50 to-emerald-100",
  },
  {
    title: "This Month",
    value: "$48,200",
    change: "+8.3%",
    icon: TrendingUp,
    color: "from-blue-500 to-blue-600",
    bgGradient: "from-blue-50 to-blue-100",
  },
  {
    title: "Pending Payments",
    value: "$32,400",
    change: "156 invoices",
    icon: Clock,
    color: "from-amber-500 to-amber-600",
    bgGradient: "from-amber-50 to-amber-100",
  },
  {
    title: "Overdue Amount",
    value: "$12,800",
    change: "43 invoices",
    icon: AlertTriangle,
    color: "from-red-500 to-red-600",
    bgGradient: "from-red-50 to-red-100",
  },
]

export default function FeesPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setPaymentModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-emerald-50/20">
      <Sidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <Header />
        <main className="p-6 space-y-6">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">💰 Fees & Payments Management</h1>
              <p className="text-emerald-100 mt-1">Manage fee invoices, payments, and collection reports</p>
            </div>
            <div className="flex gap-2">
              <Button className="gap-2 bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm">
                <Send className="h-4 w-4" />
                Send Reminders
              </Button>
              <Button className="gap-2 bg-white text-emerald-600 hover:bg-gray-100" onClick={() => setCreateModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Invoice
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className={`border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br ${stat.bgGradient}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                    </div>
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                      <stat.icon className="h-7 w-7 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Collection Stats */}
          <FeeCollectionStats />

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full md:w-auto">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input placeholder="Search invoices..." className="pl-10 bg-gray-50 border-gray-300" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[140px] bg-gray-50 border-gray-300">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-full sm:w-[140px] bg-gray-50 border-gray-300">
                  <SelectValue placeholder="Class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="6">Class 6</SelectItem>
                  <SelectItem value="7">Class 7</SelectItem>
                  <SelectItem value="8">Class 8</SelectItem>
                  <SelectItem value="9">Class 9</SelectItem>
                  <SelectItem value="10">Class 10</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="gap-2 bg-gray-50 border-gray-300 hover:bg-gray-100">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {/* Invoice Table */}
          <InvoiceTable onRecordPayment={handleRecordPayment} />

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <p className="text-sm text-gray-600">Showing 1-6 of 156 invoices</p>
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">Previous</button>
              <button className="px-3 py-2 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-medium">1</button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">2</button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">3</button>
              <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium">Next</button>
            </div>
          </div>
        </main>
      </div>

      {/* Modals */}
      <CreateInvoiceModal open={createModalOpen} onOpenChange={setCreateModalOpen} />
      <RecordPaymentModal invoice={selectedInvoice} open={paymentModalOpen} onOpenChange={setPaymentModalOpen} />
    </div>
  )
}
