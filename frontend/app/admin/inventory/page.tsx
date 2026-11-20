"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertTriangle, Boxes, Loader2, Package, Search, Wallet } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { money, useInventoryOverview } from "@/lib/hooks/use-operations"
import { cn } from "@/lib/utils"

const conditionTone: Record<string, string> = {
  NEW: "bg-emerald-100 text-emerald-700",
  GOOD: "bg-blue-100 text-blue-700",
  FAIR: "bg-amber-100 text-amber-700",
  POOR: "bg-orange-100 text-orange-700",
  DAMAGED: "bg-rose-100 text-rose-700",
  DISPOSED: "bg-slate-200 text-slate-700",
}

export default function AdminInventoryPage() {
  const { ready } = useRequireRole("ADMIN")
  const { overview, isLoading, error } = useInventoryOverview()
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("")

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categories = overview?.categories ?? []
  const items = (overview?.items ?? []).filter((item) => {
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.code.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !category || item.category === category
    return matchesSearch && matchesCategory
  })

  const stats = [
    { label: "Items", value: overview?.items.length ?? 0, icon: Package, tone: "bg-blue-50 text-blue-600" },
    { label: "Categories", value: categories.length, icon: Boxes, tone: "bg-violet-50 text-violet-600" },
    {
      label: "Stock value",
      value: `PKR ${money(overview?.totalValue ?? 0)}`,
      icon: Wallet,
      tone: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Low stock",
      value: overview?.lowStock ?? 0,
      icon: AlertTriangle,
      tone: "bg-rose-50 text-rose-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">Inventory</h1>
            <p className="text-muted-foreground">Stock levels, valuations and low-stock alerts</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.tone)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{isLoading ? "—" : stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or code…"
                className="pl-8"
                aria-label="Search inventory"
              />
            </div>
            <select
              aria-label="Category"
              className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {categories.map((entry) => (
                <option key={entry.name} value={entry.name}>
                  {entry.name}
                </option>
              ))}
            </select>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Stock register</CardTitle>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No items match these filters.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2">Item</th>
                          <th className="py-2">Category</th>
                          <th className="py-2 text-right">Qty</th>
                          <th className="py-2 text-right">Min</th>
                          <th className="py-2 text-right">Unit price</th>
                          <th className="py-2 text-right">Value</th>
                          <th className="py-2">Condition</th>
                          <th className="py-2">Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b last:border-0">
                            <td className="py-2">
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.code}</p>
                            </td>
                            <td className="py-2">
                              <Badge variant="secondary">{item.category}</Badge>
                            </td>
                            <td className="py-2 text-right">
                              <span className={cn("font-medium", item.lowStock && "text-rose-600")}>
                                {item.quantity}
                              </span>
                              {item.lowStock && <AlertTriangle className="ml-1 inline h-3 w-3 text-rose-500" />}
                            </td>
                            <td className="py-2 text-right text-muted-foreground">{item.minQuantity}</td>
                            <td className="py-2 text-right">{money(item.unitPrice)}</td>
                            <td className="py-2 text-right font-medium">{money(item.value)}</td>
                            <td className="py-2">
                              <Badge className={conditionTone[item.condition] ?? "bg-muted"}>
                                {item.condition.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="py-2 text-muted-foreground">{item.location ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {categories.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Value by category</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((entry) => (
                  <div key={entry.name} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.items} items · {entry.quantity} units
                    </p>
                    <p className="mt-1 text-lg font-bold">PKR {money(entry.value)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  )
}
