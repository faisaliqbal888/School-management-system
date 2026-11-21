"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { ChangePasswordCard, DevicesCard, PersonalDetailsCard } from "@/components/account/account-security"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, ShieldCheck } from "lucide-react"

/**
 * One page for every role: the things a user can safely manage about their own
 * account. Anything that changes permissions stays with the admin desk.
 */
export default function AccountSecurityPage() {
  const { ready } = useRequireRole("ADMIN", "TEACHER", "STUDENT", "PARENT")
  const { user, refreshUser } = useAuth()

  if (!ready || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6 text-primary" /> Account &amp; security
          </h1>
          <p className="text-muted-foreground">
            Manage your password, personal details and signed-in devices.
          </p>
        </div>
        <Badge variant="secondary">Signed in as {user.role.toLowerCase()}</Badge>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 text-sm">
          <p className="font-medium">{user.email}</p>
          <p className="text-muted-foreground">
            Never share your password. The school will never ask for it by email, phone or WhatsApp.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PersonalDetailsCard
          initialName={user.name}
          initialPhone={user.phone}
          email={user.email}
          onSaved={refreshUser}
        />
        <ChangePasswordCard />
      </div>

      <DevicesCard />
    </div>
  )
}
