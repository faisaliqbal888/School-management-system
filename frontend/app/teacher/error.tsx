"use client"

import { RoleErrorState } from "@/components/layout/error-state"

export default function TeacherError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RoleErrorState role="teacher" error={error} reset={reset} />
}
