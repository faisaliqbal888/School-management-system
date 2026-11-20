import { Loader2 } from "lucide-react"

/** Route-transition fallback; segment-level skeletons still win where they exist. */
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    </div>
  )
}
