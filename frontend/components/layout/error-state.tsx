"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, LayoutDashboard, RotateCcw } from "lucide-react"

const ROLE_HOME: Record<string, { href: string; label: string }> = {
  admin: { href: "/admin/dashboard", label: "Back to dashboard" },
  teacher: { href: "/teacher/dashboard", label: "Back to dashboard" },
  student: { href: "/student/dashboard", label: "Back to dashboard" },
  parent: { href: "/parent/dashboard", label: "Back to dashboard" },
}

interface Props {
  error: Error & { digest?: string }
  reset: () => void
  role?: keyof typeof ROLE_HOME
  /** Shown under the heading — lets a page explain what failed. */
  hint?: string
}

/**
 * Error boundary body used by the role-level `error.tsx` files.
 *
 * A failing page only replaces its own segment, so the sidebar and header keep
 * working and the user can move elsewhere without a reload.
 */
export function RoleErrorState({ error, reset, role, hint }: Props) {
  useEffect(() => {
    console.error("Route error:", error)
  }, [error])

  const home = role ? ROLE_HOME[role] : { href: "/", label: "Go home" }

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
          <AlertTriangle className="h-7 w-7 text-rose-600" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold">This page could not load</h1>
          <p className="text-sm text-muted-foreground">
            {hint ?? "The request failed. Your data is safe — retry, or continue somewhere else."}
          </p>
        </div>

        <p className="rounded-md bg-muted px-3 py-2 text-left text-xs text-muted-foreground">
          <span className="font-medium">Reason:</span> {error.message || "unknown error"}
          {error.digest && <span className="ml-2 font-mono opacity-70">({error.digest})</span>}
        </p>

        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href={home.href}>
              <LayoutDashboard className="mr-2 h-4 w-4" /> {home.label}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AdminErrorState(props: Omit<Props, "role">) {
  return <RoleErrorState {...props} role="admin" />
}
