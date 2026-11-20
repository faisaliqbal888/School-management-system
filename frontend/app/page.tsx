"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useAuth, ROLE_HOME } from "@/lib/auth-context"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    router.replace(user ? (ROLE_HOME[user.role] ?? "/login") : "/login")
  }, [isLoading, user, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting…</p>
      </div>
    </div>
  )
}
