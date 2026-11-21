"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Camera, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { API_BASE } from "@/lib/api-client"
import { ensureCsrfToken } from "@/lib/api-client"

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"]

/**
 * Avatar uploader for the signed-in account.
 *
 * Uploads go through `fetch` directly rather than `apiFetch` because the body is
 * `FormData` — setting `Content-Type` manually would strip the multipart
 * boundary. CSRF still has to be sent, so the token is fetched first.
 */
export function AvatarUploader({
  name,
  currentUrl,
  onUploaded,
}: {
  name: string
  currentUrl?: string | null
  onUploaded?: (url: string | null) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [busy, setBusy] = useState(false)

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"

  async function upload(file: File) {
    // Checked here for an instant answer; the server checks again for real.
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Choose a PNG, JPEG or WebP image")
      return
    }
    if (file.size > MAX_BYTES) {
      toast.error("Images must be 2 MB or smaller")
      return
    }

    setBusy(true)
    try {
      const csrf = await ensureCsrfToken()
      const body = new FormData()
      body.append("avatar", file)

      const res = await fetch(`${API_BASE}/uploads/avatar`, {
        method: "POST",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : undefined,
        body,
      })

      const payload = (await res.json().catch(() => null)) as
        | { success: true; data: { url: string } }
        | { success: false; error: { message: string } }
        | null

      if (!res.ok || !payload || payload.success === false) {
        throw new Error(
          payload && payload.success === false ? payload.error.message : `Upload failed (${res.status})`,
        )
      }

      setPreview(payload.data.url)
      onUploaded?.(payload.data.url)
      toast.success("Photo updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload that image")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  async function remove() {
    setBusy(true)
    try {
      const csrf = await ensureCsrfToken()
      const res = await fetch(`${API_BASE}/uploads/avatar`, {
        method: "DELETE",
        credentials: "include",
        headers: csrf ? { "X-CSRF-Token": csrf } : undefined,
      })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      setPreview(null)
      onUploaded?.(null)
      toast.success("Photo removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not remove the photo")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 ring-4 ring-border">
        {preview && <AvatarImage src={preview} alt={name} />}
        <AvatarFallback className="bg-primary/10 text-2xl text-primary">{initials}</AvatarFallback>
      </Avatar>

      <div className="space-y-1">
        <p className="text-sm font-medium">Photo</p>
        <p className="text-xs text-muted-foreground">PNG, JPEG or WebP · up to 2 MB</p>
        {(preview || busy) && (
          <div className="flex gap-2 pt-1">
            {preview && (
              <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" disabled={busy} onClick={() => void remove()}>
                Remove
              </Button>
            )}
          </div>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        aria-label="Upload a profile photo"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void upload(file)
        }}
      />
      <Button
        type="button"
        size="icon"
        variant="outline"
        className="ml-auto"
        disabled={busy}
        aria-label="Choose a profile photo"
        onClick={() => input.current?.click()}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
      </Button>
    </div>
  )
}
