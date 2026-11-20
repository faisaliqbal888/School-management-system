import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Compass, Home, LayoutDashboard } from "lucide-react"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Compass className="h-7 w-7 text-primary" />
        </div>

        <div className="space-y-1">
          <p className="text-5xl font-black tracking-tight text-muted-foreground/40">404</p>
          <h1 className="text-xl font-bold">Page not found</h1>
          <p className="text-sm text-muted-foreground">
            The page you asked for does not exist, or the record behind it was removed.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild>
            <Link href="/">
              <Home className="mr-2 h-4 w-4" /> Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/login">
              <LayoutDashboard className="mr-2 h-4 w-4" /> Sign in
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
