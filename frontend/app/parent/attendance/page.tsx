"use client"

import { ClipboardCheck, Loader2 } from "lucide-react"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { ParentSidebar } from "@/components/parent/parent-sidebar"
import { ParentHeader } from "@/components/parent/parent-header"
import { Card, CardContent } from "@/components/ui/card"

export default function ParentAttendancePage() {
  const { user } = useAuth()
  const { ready } = useRequireRole("PARENT")

  if (!ready) return <FullPageLoader />

  const children = user?.children ?? []

  return (
    <div className="min-h-screen bg-background">
      <ParentSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <ParentHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-gray-50 via-white to-rose-50/20 p-6">
          <div className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold">Attendance</h1>
            <p className="mt-1 text-rose-100">Daily and monthly attendance for your children.</p>
          </div>

          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <ClipboardCheck className="h-7 w-7" />
              </div>
              {children.length === 0 ? (
                <p className="max-w-sm text-sm text-muted-foreground">
                  No children are linked to this account yet. Please contact the school office.
                </p>
              ) : (
                <>
                  <p className="font-semibold">
                    {children.map((c) => c.name).join(", ")}
                  </p>
                  <p className="max-w-md text-sm text-muted-foreground">
                    This view is being wired to the API in Phase 3. Attendance, results and fee data
                    will appear here once the student and fee endpoints land.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
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
