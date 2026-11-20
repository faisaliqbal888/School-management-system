"use client"

import Link from "next/link"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, AlertOctagon, AlertTriangle, ArrowRight, CheckCircle2, Info, Loader2, RefreshCw } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useAlerts } from "@/lib/hooks/use-admin"
import { cn } from "@/lib/utils"

const severityStyles = {
  critical: {
    wrapper: "border-l-rose-500 bg-rose-50/60",
    badge: "bg-rose-100 text-rose-800",
    icon: AlertOctagon,
  },
  warning: {
    wrapper: "border-l-amber-500 bg-amber-50/60",
    badge: "bg-amber-100 text-amber-800",
    icon: AlertTriangle,
  },
  info: {
    wrapper: "border-l-sky-500 bg-sky-50/60",
    badge: "bg-sky-100 text-sky-800",
    icon: Info,
  },
} as const

export default function AdminAlertsPage() {
  const { ready } = useRequireRole("ADMIN")
  const { alerts, summary, generatedAt, isLoading, error, refetch } = useAlerts()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const counters = [
    { label: "Critical", value: summary.critical, icon: AlertTriangle, tone: "border-l-rose-500", color: "text-rose-500" },
    { label: "Warning", value: summary.warning, icon: AlertOctagon, tone: "border-l-amber-500", color: "text-amber-500" },
    { label: "Info", value: summary.info, icon: AlertCircle, tone: "border-l-sky-500", color: "text-sky-500" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">System alerts</h1>
              <p className="text-muted-foreground">
                Live conditions across fees, attendance, library and inventory
                {generatedAt && (
                  <span className="ml-1 text-xs">
                    · refreshed {new Date(generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                )}
              </p>
            </div>
            <Button variant="outline" onClick={refetch} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Refresh
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {counters.map((counter) => (
              <Card key={counter.label} className={cn("border-0 border-l-4 shadow-sm", counter.tone)}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-sm text-muted-foreground">{counter.label}</p>
                    <p className="text-2xl font-bold">{isLoading ? "—" : counter.value}</p>
                  </div>
                  <counter.icon className={cn("h-8 w-8", counter.color)} />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>Open alerts</CardTitle>
            </CardHeader>
            <CardContent>
              {error ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{error}</p>
              ) : isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                  <p className="font-medium">Everything is on track</p>
                  <p className="text-sm text-muted-foreground">
                    No overdue fees, attendance dips, late books or low stock right now.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const style = severityStyles[alert.severity]
                    return (
                      <div
                        key={alert.id}
                        className={cn("flex flex-wrap items-start gap-4 rounded-lg border-l-4 p-4", style.wrapper)}
                      >
                        <style.icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">{alert.title}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">{alert.message}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={style.badge}>{alert.severity}</Badge>
                          <Button asChild variant="ghost" size="sm">
                            <Link href={alert.href}>
                              Open <ArrowRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
