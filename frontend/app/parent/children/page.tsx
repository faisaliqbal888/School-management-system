"use client"

import Link from "next/link"
import { Users, Loader2 } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDashboardSummary, money } from "@/lib/hooks/use-dashboard"

export default function ParentChildrenPage() {
  const { ready } = useRequireRole("PARENT")
  const { summary, isLoading, error } = useDashboardSummary()

  if (!ready) return <FullPageLoader />

  const learner = summary?.role === "PARENT" ? summary : undefined
  const children = learner?.students ?? []
  const fees = learner?.fees

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="flex items-center gap-2 text-3xl font-bold">
              <Users className="h-7 w-7" /> My Children
            </h1>
            <p className="mt-1 text-rose-100">
              {children.length > 0
                ? `${children.length} child${children.length === 1 ? "" : "ren"} linked to this account`
                : "No children are linked to this account yet."}
            </p>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                Could not load your children. Please try again later.
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-52 w-full" />
              ))}
            </div>
          ) : children.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-14 text-center">
                <Users className="h-9 w-9 text-muted-foreground/50" />
                <p className="font-medium">No children linked</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Please contact the school office to link your children to this parent account.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {children.map((child) => (
                  <Card key={child.id}>
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-14 w-14">
                          <AvatarImage src={child.avatarUrl ?? undefined} alt={child.name} />
                          <AvatarFallback className="bg-rose-100 text-rose-600">
                            {child.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-lg font-semibold">{child.name}</p>
                          <p className="truncate text-sm text-muted-foreground">
                            {child.className}-{child.sectionName} · Roll {child.rollNo ?? "—"}
                          </p>
                        </div>
                      </div>

                      <dl className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <dt className="text-xs text-muted-foreground">Admission no</dt>
                          <dd className="font-medium">{child.admissionNo}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Email</dt>
                          <dd className="truncate font-medium">{child.email}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Class</dt>
                          <dd className="font-medium">{child.className}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted-foreground">Section</dt>
                          <dd className="font-medium">{child.sectionName}</dd>
                        </div>
                      </dl>

                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/parent/attendance">Attendance</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/parent/results">Results</Link>
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href="/parent/timetable">Timetable</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {fees && (
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <p className="text-sm text-muted-foreground">Fees across all children</p>
                      <p className="text-2xl font-bold">PKR {money(fees.outstanding)} outstanding</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={fees.outstanding > 0 ? "destructive" : "secondary"}>
                        {fees.outstanding > 0 ? `${fees.overdue} overdue` : "All clear"}
                      </Badge>
                      <Button size="sm" asChild>
                        <Link href="/parent/fees">View invoices</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
