"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, Users, Bed, CreditCard } from "lucide-react"

const stats = [
  {
    title: "Total Rooms",
    value: "120",
    subtitle: "Across 2 blocks",
    icon: Building2,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  {
    title: "Students Housed",
    value: "380",
    subtitle: "85% occupancy",
    icon: Users,
    color: "text-emerald-600",
    bgColor: "bg-emerald-500/10",
  },
  {
    title: "Available Beds",
    value: "68",
    subtitle: "Ready for allocation",
    icon: Bed,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
  },
  {
    title: "Monthly Revenue",
    value: "$45,200",
    subtitle: "+12% vs last month",
    icon: CreditCard,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
]

const blocks = [
  { name: "Block A - Boys", rooms: 60, capacity: 220, occupied: 198 },
  { name: "Block B - Girls", rooms: 60, capacity: 228, occupied: 182 },
]

export function HostelStats() {
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
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
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
          <CardTitle className="text-base font-semibold">Block Occupancy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {blocks.map((block) => {
              const percentage = Math.round((block.occupied / block.capacity) * 100)
              return (
                <div key={block.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{block.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">({block.rooms} rooms)</span>
                    </div>
                    <span className="text-sm font-medium">
                      {block.occupied}/{block.capacity} ({percentage}%)
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percentage > 90 ? "bg-rose-500" : percentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
