"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FeeCollectionStats } from "@/components/fees/fee-collection-stats"
import { InvoiceTable } from "@/components/fees/invoice-table"
import { CreditCard, DollarSign, TrendingUp, AlertCircle, Loader2 } from "lucide-react"

const stats = [
  {
    title: "Total Revenue",
    value: "$45,230",
    change: "+12.5%",
    icon: DollarSign,
    color: "bg-success/10 text-success",
  },
  {
    title: "Pending Payment",
    value: "$8,450",
    change: "-3.2%",
    icon: AlertCircle,
    color: "bg-warning/10 text-warning",
  },
  {
    title: "Collection Rate",
    value: "94.2%",
    change: "+2.1%",
    icon: TrendingUp,
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Total Invoices",
    value: "2,847",
    change: "+128 this month",
    icon: CreditCard,
    color: "bg-accent/10 text-accent",
  },
]

export default function AdminFeesPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      router.push("/login")
    }
  }, [isLoading, isAuthenticated, user, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fees & Payments</h1>
              <p className="text-muted-foreground">Manage fees collection and payments</p>
            </div>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="collection" className="space-y-6">
            <TabsList>
              <TabsTrigger value="collection">Collection Stats</TabsTrigger>
              <TabsTrigger value="invoices">Invoices</TabsTrigger>
            </TabsList>

            <TabsContent value="collection">
              <FeeCollectionStats />
            </TabsContent>

            <TabsContent value="invoices">
              <InvoiceTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
