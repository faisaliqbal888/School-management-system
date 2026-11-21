"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Loader2 } from "lucide-react"
import { useRoomMutations } from "@/lib/hooks/use-operations"
import { useStudents } from "@/lib/hooks/use-students"
import { roomSchema, ROOM_STATUSES, ROOM_TYPES, type RoomValues } from "@/lib/validation/schemas"

function rootErrorOf(form: { formState: { errors: { root?: { message?: string } } } }) {
  return form.formState.errors.root?.message
}

export interface RoomRow {
  id: string
  block: string
  roomNo: string
  type: string
  capacity: number
  occupied: number
  monthlyFee: number
  status: string
}

// ─────────────────────────────────────────────────────────────
//  Room create / edit
// ─────────────────────────────────────────────────────────────

export function RoomDialog({
  open,
  onOpenChange,
  room,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: RoomRow | null
  onSaved?: () => void
}) {
  const { create, update } = useRoomMutations(onSaved)

  const form = useForm<RoomValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: { block: "", roomNo: "", type: "DOUBLE", capacity: 2, monthlyFee: 0, status: "AVAILABLE" },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      block: room?.block ?? "",
      roomNo: room?.roomNo ?? "",
      type: (room?.type as RoomValues["type"]) ?? "DOUBLE",
      capacity: room?.capacity ?? 2,
      monthlyFee: room?.monthlyFee ?? 0,
      status: (room?.status as RoomValues["status"]) ?? "AVAILABLE",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, room])

  const submit = form.handleSubmit(async (values) => {
    try {
      if (room) {
        await update.mutate({ id: room.id, ...values })
        toast.success("Room updated")
      } else {
        await create.mutate(values)
        toast.success("Room added")
      }
      onOpenChange(false)
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Could not save the room" })
    }
  })

  const rootError = rootErrorOf(form)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{room ? "Edit room" : "Add room"}</DialogTitle>
          <DialogDescription>
            Capacity cannot be reduced below the residents already living here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="block"
              render={({ field }) => (
                <FormItem>
                  <Label>Block</Label>
                  <Input placeholder="A" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="roomNo"
              render={({ field }) => (
                <FormItem>
                  <Label>Room no</Label>
                  <Input placeholder="101" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <Label>Type</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <Label>Beds</Label>
                  <Input type="number" min={1} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="monthlyFee"
              render={({ field }) => (
                <FormItem>
                  <Label>Monthly fee (PKR)</Label>
                  <Input type="number" min={0} step={500} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <Label>Status</Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {rootError && (
            <Alert variant="destructive">
              <AlertDescription>{rootError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending || update.isPending}>
              {(create.isPending || update.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {room ? "Save changes" : "Add room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
//  Allocate a learner
// ─────────────────────────────────────────────────────────────

interface StudentOption {
  id: string
  name: string
  admissionNo: string
  className?: string | null
}

export function AllocateDialog({
  open,
  onOpenChange,
  room,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: RoomRow | null
  onSaved?: () => void
}) {
  const { allocate, vacate } = useRoomMutations(onSaved)
  const [studentId, setStudentId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { students } = useStudents({ limit: 100, page: 1 })

  useEffect(() => {
    if (open) {
      setStudentId("")
      setError(null)
    }
  }, [open])

  if (!room) return null

  const residents = (room as RoomRow & { residents?: { allocationId: string; studentId: string; name: string; admissionNo: string }[] }).residents ?? []
  const free = room.capacity - room.occupied

  async function assign() {
    if (!studentId) {
      setError("Choose a learner")
      return
    }
    try {
      const result = await allocate.mutate({ roomId: room!.id, studentId })
      toast.success("Learner allocated", { description: `${result.occupied}/${result.capacity} beds in use` })
      setStudentId("")
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not allocate this learner")
    }
  }

  async function release(allocationId: string) {
    try {
      await vacate.mutate(allocationId)
      toast.success("Bed freed")
      onSaved?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not vacate this learner")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Room {room.block}-{room.roomNo}
          </DialogTitle>
          <DialogDescription>
            {room.occupied}/{room.capacity} beds in use · {free} free
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {residents.length > 0 && (
            <ul className="divide-y rounded-md border">
              {residents.map((resident) => (
                <li key={resident.allocationId} className="flex items-center justify-between gap-2 p-2 text-sm">
                  <span className="truncate">
                    {resident.name} <span className="text-muted-foreground">· {resident.admissionNo}</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={vacate.isPending}
                    onClick={() => void release(resident.allocationId)}
                  >
                    Vacate
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {free > 0 ? (
            <div className="space-y-1.5">
              <Label>Allocate a learner</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a learner" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {(student as StudentOption).name} · {(student as StudentOption).admissionNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                disabled={allocate.isPending || !studentId}
                onClick={() => void assign()}
              >
                {allocate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Allocate bed
              </Button>
            </div>
          ) : (
            <p className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              This room is full. Vacate someone before adding another learner.
            </p>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
