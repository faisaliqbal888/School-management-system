"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Bus, Loader2, MapPin, Phone, Route, Users } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { money, useTransportOverview } from "@/lib/hooks/use-operations"
import { cn } from "@/lib/utils"

const statusTone: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  MAINTENANCE: "bg-amber-100 text-amber-700",
  INACTIVE: "bg-slate-200 text-slate-700",
}

export default function AdminTransportPage() {
  const { ready } = useRequireRole("ADMIN")
  const { overview, isLoading, error } = useTransportOverview()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const routes = overview?.routes ?? []
  const monthlyFees = routes.reduce((sum, route) => sum + route.monthlyFee * route.riders, 0)

  const stats = [
    { label: "Routes", value: routes.length, icon: Route, tone: "bg-blue-50 text-blue-600" },
    { label: "Vehicles", value: overview?.vehicles.length ?? 0, icon: Bus, tone: "bg-violet-50 text-violet-600" },
    { label: "Riders", value: overview?.riders ?? 0, icon: Users, tone: "bg-emerald-50 text-emerald-600" },
    {
      label: "Monthly transport fees",
      value: `PKR ${money(monthlyFees)}`,
      icon: MapPin,
      tone: "bg-amber-50 text-amber-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div>
            <h1 className="text-2xl font-bold">Transport</h1>
            <p className="text-muted-foreground">Routes, vehicles and riders</p>
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

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-40 w-full" />
              ))}
            </div>
          ) : routes.length === 0 ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No transport routes have been configured.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {routes.map((route) => (
                <Card key={route.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{route.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {route.startPoint} → {route.endPoint} · {route.distanceKm} km
                        </p>
                      </div>
                      <Badge variant={route.isActive ? "secondary" : "outline"}>
                        {route.isActive ? "active" : "paused"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {route.riders} riders
                        {route.vehicle && ` / ${route.vehicle.capacity} seats`}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        PKR {money(route.monthlyFee)} / month
                      </span>
                    </div>

                    {route.vehicle ? (
                      <div className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {route.vehicle.registrationNo} · {route.vehicle.model}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              Driver: {route.vehicle.driverName}
                            </p>
                          </div>
                          <Badge className={statusTone[route.vehicle.status] ?? "bg-muted"}>
                            {route.vehicle.status.toLowerCase()}
                          </Badge>
                        </div>
                        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {route.vehicle.driverPhone}
                        </p>
                      </div>
                    ) : (
                      <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                        No vehicle assigned to this route.
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
