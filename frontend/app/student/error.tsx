"use client"

import { RoleErrorState } from "@/components/layout/error-state"

export default function StudentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorState role="student" error={error} reset={reset} />
}
