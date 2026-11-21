"use client"

import { useCallback, useEffect, useState } from "react"
import { api, ApiRequestError } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, KeyRound, Loader2, LogOut, Monitor, ShieldCheck, XCircle } from "lucide-react"

/** Mirrors the server-side policy in `auth.validator.ts` so users get instant feedback. */
export const PASSWORD_RULES = [
  { id: "len", label: "At least 10 characters", test: (v: string) => v.length >= 10 },
  { id: "upper", label: "An uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { id: "lower", label: "A lowercase letter", test: (v: string) => /[a-z]/.test(v) },
  { id: "digit", label: "A digit", test: (v: string) => /[0-9]/.test(v) },
] as const

export function PasswordStrengthList({ value }: { value: string }) {
  return (
    <ul className="space-y-1 text-xs">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(value)
        return (
          <li
            key={rule.id}
            className={passed ? "flex items-center gap-1.5 text-emerald-600" : "flex items-center gap-1.5 text-muted-foreground"}
          >
            {passed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            {rule.label}
          </li>
        )
      })}
    </ul>
  )
}

// ─────────────────────────────────────────────────────────────
//  Password change
// ─────────────────────────────────────────────────────────────

export function ChangePasswordCard() {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  const meetsAll = PASSWORD_RULES.every((rule) => rule.test(next))
  const canSubmit = current.length > 0 && meetsAll && next === confirm && next !== current

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setDone(null)
    setBusy(true)
    try {
      await api.post("/auth/change-password", {
        currentPassword: current,
        newPassword: next,
        confirmPassword: confirm,
      })
      setCurrent("")
      setNext("")
      setConfirm("")
      setDone("Password updated. Every device has been signed out — please sign in again.")
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not change the password")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> Password
        </CardTitle>
        <CardDescription>
          Changing your password signs out all other devices, which is how a stolen session gets cut off.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(event) => setCurrent(event.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </div>
          </div>

          <PasswordStrengthList value={next} />

          {confirm.length > 0 && next !== confirm && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {done && (
            <Alert>
              <AlertDescription>{done}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={!canSubmit || busy}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
//  Devices / sessions
// ─────────────────────────────────────────────────────────────

interface DeviceSession {
  id: string
  userAgent: string | null
  ipAddress: string | null
  createdAt: string
  expiresAt: string
}

function describeAgent(userAgent: string | null): string {
  if (!userAgent) return "Unknown device"
  if (/iPhone|iPad/i.test(userAgent)) return "iPhone / iPad"
  if (/Android/i.test(userAgent)) return "Android device"
  if (/Macintosh/i.test(userAgent)) return "Mac"
  if (/Windows/i.test(userAgent)) return "Windows PC"
  if (/Linux/i.test(userAgent)) return "Linux PC"
  return userAgent.slice(0, 60)
}

function relative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

export function DevicesCard() {
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setSessions(await api.get<DeviceSession[]>("/auth/sessions"))
      setError(null)
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load sessions")
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function revoke(id: string) {
    setBusy(true)
    setNote(null)
    try {
      await api.delete(`/auth/sessions/${id}`)
      setNote("That device has been signed out.")
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not sign the device out")
    } finally {
      setBusy(false)
    }
  }

  async function revokeOthers() {
    setBusy(true)
    setNote(null)
    try {
      const result = await api.delete<{ revoked: number }>("/auth/sessions")
      setNote(
        result.revoked > 0
          ? `${result.revoked} other device(s) signed out.`
          : "No other devices were signed in.",
      )
      await load()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not sign the other devices out")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" /> Signed-in devices
        </CardTitle>
        <CardDescription>
          Every place your account is currently active. Sign out anything you do not recognise.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {note && (
          <Alert>
            <AlertDescription>{note}</AlertDescription>
          </Alert>
        )}

        {sessions === null && <p className="text-sm text-muted-foreground">Loading…</p>}

        {sessions?.length === 0 && (
          <p className="text-sm text-muted-foreground">No active sessions.</p>
        )}

        <ul className="divide-y rounded-md border">
          {(sessions ?? []).map((session) => (
            <li key={session.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex min-w-0 items-center gap-3">
                <Monitor className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{describeAgent(session.userAgent)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {session.ipAddress ?? "unknown IP"} · started {relative(session.createdAt)}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={() => revoke(session.id)}
                aria-label={`Sign out ${describeAgent(session.userAgent)}`}
              >
                <LogOut className="mr-1.5 h-3.5 w-3.5" /> Sign out
              </Button>
            </li>
          ))}
        </ul>

        <Button variant="outline" size="sm" disabled={busy} onClick={revokeOthers}>
          Sign out all other devices
        </Button>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────
//  Personal details
// ─────────────────────────────────────────────────────────────

export function PersonalDetailsCard({
  initialName,
  initialPhone,
  email,
  onSaved,
}: {
  initialName: string
  initialPhone: string | null
  email: string
  onSaved?: () => void | Promise<void>
}) {
  const [name, setName] = useState(initialName)
  const [phone, setPhone] = useState(initialPhone ?? "")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const dirty = name !== initialName || phone !== (initialPhone ?? "")

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setDone(false)
    try {
      await api.patch("/auth/profile", { name: name.trim(), phone: phone.trim() })
      setDone(true)
      await onSaved?.()
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save your details")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Personal details</CardTitle>
        <CardDescription>
          Your email address and role are managed by the school office and cannot be changed here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Full name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+92 300 1234567"
                maxLength={20}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input id="profile-email" value={email} disabled />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {done && (
            <Alert>
              <AlertDescription>Saved.</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={!dirty || busy || name.trim().length < 2}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
