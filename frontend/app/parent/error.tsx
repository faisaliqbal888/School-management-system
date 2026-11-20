"use client"

import { RoleErrorState } from "@/components/layout/error-state"

export default function ParentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorState role="parent" error={error} reset={reset} />
}
