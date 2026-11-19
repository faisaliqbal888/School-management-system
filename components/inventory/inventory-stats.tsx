"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, TrendingUp, Archive } from "lucide-react"

const stats = [
  {
    title: "Total Items",
    value: "1,248",
    change: "8 categories",
    icon: Package,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Low Stock Items",
    value: "12",
    change: "Needs attention",
    icon: AlertTriangle,
    color: "text-rose-600",
    bgColor: "bg-rose-500/10",
  },
  {
    title: "Monthly Usage",
    value: "342",
    change: "+5% vs last month",
    icon: TrendingUp,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Total Value",
    value: "$124,500",
    change: "Current inventory",
    icon: Archive,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
]

const categories = [
  { name: "Electronics", count: 185, value: 45000 },
  { name: "Furniture", count: 520, value: 38000 },
  { name: "Stationery", count: 280, value: 8500 },
  { name: "Laboratory", count: 95, value: 22000 },
  { name: "Sports", count: 168, value: 11000 },
]

export function InventoryStats() {
  const maxCount = Math.max(...categories.map((c) => c.count))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Inventory by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((cat) => (
              <div key={cat.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{cat.name}</span>
                  <span className="text-muted-foreground">
                    {cat.count} items (${cat.value.toLocaleString()})
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(cat.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
