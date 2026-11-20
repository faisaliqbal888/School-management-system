"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RotateCcw } from "lucide-react"

/**
 * App-wide error boundary.
 *
 * Rendered when a segment throws during render or a server component rejects.
 * Keeps the shell (fonts, providers) intact and offers a way back instead of a
 * blank screen.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Surfaces in the browser console and in server logs for triage.
    console.error("Unhandled application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50">
          <AlertTriangle className="h-7 w-7 text-rose-600" />
        </div>

        <div className="space-y-1">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            This page could not be loaded. The rest of the app is unaffected — try again, or head
            back to your dashboard.
          </p>
        </div>

        {error.digest && (
          <p className="rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
            Reference: {error.digest}
          </p>
        )}

        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Try again
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Go home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
