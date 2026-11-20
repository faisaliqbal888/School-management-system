"use client"

import { useEffect, useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, RotateCcw, Save, School, Wallet, CalendarDays, BellRing } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useSettings, useUserMutations } from "@/lib/hooks/use-admin"
import { toast } from "sonner"

const GROUPS: { title: string; icon: typeof School; hint: string; keys: string[] }[] = [
  {
    title: "School profile",
    icon: School,
    hint: "Shown on report cards, invoices and export headers",
    keys: ["school.name", "school.address", "school.phone", "school.email", "school.principal"],
  },
  {
    title: "Academics",
    icon: CalendarDays,
    hint: "Default term the dashboards aggregate over",
    keys: ["academic.currentTerm"],
  },
  {
    title: "Finance",
    icon: Wallet,
    hint: "Currency used in every money label and the late-fee percentage",
    keys: ["finance.currency", "finance.lateFeePercent"],
  },
  {
    title: "Attendance & notifications",
    icon: BellRing,
    hint: "Thresholds behind the dashboards and the alerts page",
    keys: ["attendance.warningThreshold", "notifications.emailEnabled"],
  },
]

const labels: Record<string, string> = {
  "school.name": "School name",
  "school.address": "Address",
  "school.phone": "Phone",
  "school.email": "Email",
  "school.principal": "Principal",
  "academic.currentTerm": "Current term",
  "finance.currency": "Currency",
  "finance.lateFeePercent": "Late fee (%)",
  "attendance.warningThreshold": "Attendance warning (%)",
  "notifications.emailEnabled": "Email notifications",
}

export default function AdminSettingsPage() {
  const { ready } = useRequireRole("ADMIN")
  const { settings, isLoading, error, refetch } = useSettings()
  const { pending, saveSettings } = useUserMutations()

  const [draft, setDraft] = useState<Record<string, string>>({})
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (settings.length > 0 && !dirty) {
      setDraft(Object.fromEntries(settings.map((entry) => [entry.key, entry.value])))
    }
  }, [settings, dirty])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const changed = settings.filter((entry) => (draft[entry.key] ?? entry.value) !== entry.value)

  const save = async () => {
    if (changed.length === 0) return
    try {
      await saveSettings(changed.map((entry) => ({ key: entry.key, value: draft[entry.key] ?? entry.value })))
      toast.success(`Saved ${changed.length} setting${changed.length === 1 ? "" : "s"}`)
      setDirty(false)
      refetch()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save settings")
    }
  }

  const reset = () => {
    setDraft(Object.fromEntries(settings.map((entry) => [entry.key, entry.value])))
    setDirty(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-muted-foreground">School identity, finance defaults and alert thresholds</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} disabled={!dirty || pending}>
                <RotateCcw className="mr-2 h-4 w-4" /> Discard
              </Button>
              <Button onClick={save} disabled={changed.length === 0 || pending}>
                <Save className="mr-2 h-4 w-4" />
                {pending ? "Saving…" : changed.length > 0 ? `Save ${changed.length}` : "Save"}
              </Button>
            </div>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {GROUPS.map((group) => (
                <Card key={group.title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <group.icon className="h-4 w-4 text-primary" /> {group.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{group.hint}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {group.keys.map((key) => {
                      const stored = settings.find((entry) => entry.key === key)
                      if (!stored) return null
                      const isBoolean = key === "notifications.emailEnabled"
                      const value = draft[key] ?? stored.value
                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`setting-${key}`}>{labels[key] ?? key}</Label>
                            {stored.source === "default" && <Badge variant="outline">default</Badge>}
                          </div>
                          {isBoolean ? (
                            <div className="flex items-center gap-2">
                              <input
                                id={`setting-${key}`}
                                type="checkbox"
                                className="h-4 w-4 rounded border-input"
                                checked={value === "true"}
                                onChange={(event) => {
                                  setDraft({ ...draft, [key]: event.target.checked ? "true" : "false" })
                                  setDirty(true)
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                {value === "true" ? "Enabled" : "Disabled"}
                              </span>
                            </div>
                          ) : (
                            <Input
                              id={`setting-${key}`}
                              value={value}
                              onChange={(event) => {
                                setDraft({ ...draft, [key]: event.target.value })
                                setDirty(true)
                              }}
                            />
                          )}
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
