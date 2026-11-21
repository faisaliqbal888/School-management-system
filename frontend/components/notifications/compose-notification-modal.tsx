"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { Loader2, Send } from "lucide-react"
import {
  AUDIENCE_LABEL,
  useComposerOptions,
  useCreateNotification,
} from "@/lib/hooks/use-notifications"
import { toast } from "sonner"
import { noticeSchema, type NoticeValues } from "@/lib/validation/schemas"

const selectClass =
  "h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
const textareaClass =
  "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

interface Props {
  open: boolean
  onClose: () => void
  onSent?: () => void
}

export function ComposeNotificationModal({ open, onClose, onSent }: Props) {
  const { options } = useComposerOptions(open)
  const create = useCreateNotification()

  const audiences = options?.audiences ?? []
  const classes = options?.classes ?? []

  const form = useForm<NoticeValues>({
    resolver: zodResolver(noticeSchema),
    defaultValues: { title: "", body: "", audience: "ALL", channel: "IN_APP", classId: "" },
  })

  const audience = form.watch("audience")

  // Reset on open and adopt the server's audience/class lists once they arrive.
  useEffect(() => {
    if (!open) return
    form.reset({
      title: "",
      body: "",
      audience: audiences[0] ?? "ALL",
      channel: "IN_APP",
      classId: classes[0]?.id ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, options])

  const submit = form.handleSubmit(async (values) => {
    try {
      const result = await create.mutate({
        title: values.title,
        body: values.body,
        audience: values.audience,
        channel: values.channel,
        classId: values.audience === "CLASS" ? values.classId : null,
      })

      const delivery = result?.delivery
      if (values.channel !== "IN_APP") {
        if (!delivery || delivery.attempted === 0) {
          toast.warning("Notice saved in-app only", {
            description:
              "Outbound email/SMS is not configured on this server. Ask an administrator to enable it.",
          })
        } else {
          toast.success(`Notice sent · ${delivery.sent} via ${values.channel.toLowerCase()}`, {
            description: delivery.failed > 0 ? `${delivery.failed} could not be delivered` : undefined,
          })
        }
      }

      onSent?.()
      onClose()
    } catch (err) {
      // Server-only conflicts (e.g. a class deleted mid-compose) land here.
      form.setError("root", {
        message:
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message ??
          "Could not send this notice",
      })
    }
  })

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send a notice</DialogTitle>
          <DialogDescription>
            It appears immediately in the inbox of everyone in the audience you choose.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Parent-Teacher Meeting" maxLength={140} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="body"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <textarea rows={5} maxLength={4000} placeholder="Write the full announcement…" className={textareaClass} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Audience</FormLabel>
                  <FormControl>
                    <select className={selectClass} {...field}>
                      {audiences.map((value) => (
                        <option key={value} value={value}>
                          {AUDIENCE_LABEL[value]}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {audience === "CLASS" && (
              <FormField
                control={form.control}
                name="classId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <FormControl>
                      <select className={selectClass} {...field}>
                        <option value="">Select class</option>
                        {classes.map((cls) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name} · {cls.students} students
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="channel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deliver by</FormLabel>
                <FormControl>
                  <select className={selectClass} {...field}>
                    <option value="IN_APP">In-app only (free)</option>
                    <option value="EMAIL">In-app + email</option>
                    <option value="SMS">In-app + SMS</option>
                  </select>
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  The in-app notice is always saved first. Email/SMS is skipped while the server has no
                  provider configured.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          {form.formState.errors.root && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
              {form.formState.errors.root.message}
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
