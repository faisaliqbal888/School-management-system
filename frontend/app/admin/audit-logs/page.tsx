"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollText, Search, ShieldAlert, LogIn, LogOut, KeyRound, Lock, UserCog } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useApiQuery } from "@/lib/hooks/use-api-query"

interface AuditRow {
  id: string
  action: string
  entity: string
  entityId: string | null
  metadata: Record<string, unknown> | null
  ipAddress: string | null
  createdAt: string
  user: { id: string; name: string; email: string; role: string } | null
}

const ACTION_META: Record<string, { label: string; icon: typeof LogIn; className: string }> = {
  'auth.login': { label: 'Signed in', icon: LogIn, className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'auth.logout': { label: 'Signed out', icon: LogOut, className: 'bg-slate-50 text-slate-700 border-slate-200' },
  'auth.lockout': { label: 'Account locked', icon: Lock, className: 'bg-red-50 text-red-700 border-red-200' },
  'auth.refresh_reuse': { label: 'Token reuse', icon: ShieldAlert, className: 'bg-red-50 text-red-700 border-red-200' },
  'auth.change_password': { label: 'Password changed', icon: KeyRound, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  'auth.session_revoked': { label: 'Device signed out', icon: LogOut, className: 'bg-slate-50 text-slate-700 border-slate-200' },
  'auth.sessions_revoked': { label: 'All devices signed out', icon: LogOut, className: 'bg-slate-50 text-slate-700 border-slate-200' },
  'auth.profile_update': { label: 'Profile edited', icon: UserCog, className: 'bg-blue-50 text-blue-700 border-blue-200' },
}

const ACTION_OPTIONS = [
  { value: "all", label: "All activity" },
  { value: "auth.lockout", label: "Account lockouts" },
  { value: "auth.login", label: "Sign-ins" },
  { value: "auth.change_password", label: "Password changes" },
  { value: "auth.refresh_reuse", label: "Token reuse (suspicious)" },
  { value: "student", label: "Student changes" },
]

function describe(row: AuditRow): string {
  const meta = row.metadata ?? {}
  if (row.action === 'auth.lockout') return `${String(meta.attempts ?? '5')} failed attempts`
  if (row.action === 'auth.sessions_revoked') return `${String(meta.revoked ?? 0)} session(s) revoked`
  if (row.action === 'auth.profile_update') {
    const fields = Array.isArray(meta.fields) ? (meta.fields as string[]).join(', ') : 'profile'
    return `changed ${fields}`
  }
  if (row.entityId) return `${row.entity} ${row.entityId.slice(0, 8)}…`
  return row.entity
}

export default function AdminAuditLogPage() {
  const { ready } = useRequireRole("ADMIN")
  const [page, setPage] = useState(1)
  const [action, setAction] = useState("all")
  const [search, setSearch] = useState("")

  const query = new URLSearchParams({ page: String(page), limit: "25" })
  if (action !== "all") query.set("action", action)

  const { data, meta, isLoading, error } = useApiQuery<AuditRow[]>(ready ? `/admin/audit-logs?${query}` : null)

  const rows = (data ?? []).filter((row) => {
    if (!search.trim()) return true
    const needle = search.toLowerCase()
    return (
      row.action.toLowerCase().includes(needle) ||
      (row.user?.email ?? "").toLowerCase().includes(needle) ||
      (row.user?.name ?? "").toLowerCase().includes(needle) ||
      (row.ipAddress ?? "").includes(needle)
    )
  })

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="min-h-screen space-y-6 bg-gradient-to-br from-slate-50 to-slate-100/50 p-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <ScrollText className="h-6 w-6 text-primary" /> Audit log
            </h1>
            <p className="text-muted-foreground">
              Every security-sensitive action, newest first. Entries cannot be edited or deleted.
            </p>
          </div>

          <Card>
            <CardHeader className="gap-3 pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Activity</CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter by user, IP or action"
                      className="w-64 pl-8"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <Select
                    value={action}
                    onValueChange={(value) => {
                      setAction(value)
                      setPage(1)
                    }}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="All activity" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACTION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full" />
                  ))}
                </div>
              )}

              {!isLoading && rows.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No matching activity.</p>
              )}

              <ul className="divide-y">
                {rows.map((row) => {
                  const meta_ = ACTION_META[row.action]
                  const Icon = meta_?.icon ?? ScrollText
                  return (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                            {meta_?.label ?? row.action}
                            <Badge variant="outline" className={`text-[10px] ${meta_?.className ?? ''}`}>
                              {row.action}
                            </Badge>
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {row.user ? `${row.user.name} (${row.user.email})` : 'System'} · {describe(row)}
                            {row.ipAddress ? ` · ${row.ipAddress}` : ''}
                          </p>
                        </div>
                      </div>
                      <time className="text-xs text-muted-foreground" dateTime={row.createdAt}>
                        {new Date(row.createdAt).toLocaleString()}
                      </time>
                    </li>
                  )
                })}
              </ul>

              {meta && meta.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Page {meta.page} of {meta.totalPages} · {meta.total} entries
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
