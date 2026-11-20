"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Send } from "lucide-react"
import {
  AUDIENCE_LABEL,
  useComposerOptions,
  useCreateNotification,
  type NotificationAudience,
} from "@/lib/hooks/use-notifications"

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

interface Props {
  open: boolean
  onClose: () => void
  onSent?: () => void
}

export function ComposeNotificationModal({ open, onClose, onSent }: Props) {
  const { options } = useComposerOptions(open)
  const create = useCreateNotification()

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [audience, setAudience] = useState<NotificationAudience>("ALL")
  const [classId, setClassId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const audiences = options?.audiences ?? []
  const classes = options?.classes ?? []

  useEffect(() => {
    if (!open) return
    setTitle("")
    setBody("")
    setError(null)
    const first = audiences[0]
    if (first) setAudience(first)
    if (classes[0]) setClassId(classes[0].id)
  }, [open, audiences, classes])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (title.trim().length < 3) return setError("Title must be at least 3 characters")
    if (body.trim().length < 5) return setError("Message is too short")
    if (audience === "CLASS" && !classId) return setError("Choose the class this notice is for")

    try {
      await create.mutate({
        title: title.trim(),
        body: body.trim(),
        audience,
        classId: audience === "CLASS" ? classId : null,
      })
      onSent?.()
      onClose()
    } catch (err) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
          "Could not send this notice",
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send a notice</DialogTitle>
          <DialogDescription>
            It appears immediately in the inbox of everyone in the audience you choose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="notice-title">Title</Label>
            <Input
              id="notice-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Parent-Teacher Meeting"
              maxLength={140}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notice-body">Message</Label>
            <textarea
              id="notice-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={5}
              maxLength={4000}
              placeholder="Write the full announcement…"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="notice-audience">Audience</Label>
              <select
                id="notice-audience"
                className={selectClass}
                value={audience}
                onChange={(event) => setAudience(event.target.value as NotificationAudience)}
              >
                {audiences.map((value) => (
                  <option key={value} value={value}>
                    {AUDIENCE_LABEL[value]}
                  </option>
                ))}
              </select>
            </div>

            {audience === "CLASS" && (
              <div className="space-y-1.5">
                <Label htmlFor="notice-class">Class</Label>
                <select
                  id="notice-class"
                  className={selectClass}
                  value={classId}
                  onChange={(event) => setClassId(event.target.value)}
                >
                  <option value="">Select class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} · {cls.students} students
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={create.isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send notice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
