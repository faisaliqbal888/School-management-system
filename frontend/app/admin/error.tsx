"use client"

import { AdminErrorState } from "@/components/layout/error-state"

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <AdminErrorState error={error} reset={reset} />
}
