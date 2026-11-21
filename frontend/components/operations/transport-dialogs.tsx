"use client"

import { useEffect } from "react"
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
import { useRouteMutations, useVehicleMutations } from "@/lib/hooks/use-operations"
import { routeSchema, vehicleSchema, VEHICLE_STATUSES, type RouteValues, type VehicleValues } from "@/lib/validation/schemas"

/**
 * `setError("root")` is how a server refusal (409 duplicate, 400 capacity)
 * reaches the dialog without a second error state. Reading it through a narrow
 * shape keeps this helper usable by every form in this file.
 */
function rootErrorOf(form: { formState: { errors: { root?: { message?: string } } } }) {
  return form.formState.errors.root?.message
}

// ─────────────────────────────────────────────────────────────
//  Vehicle
// ─────────────────────────────────────────────────────────────

export interface VehicleRow {
  id: string
  registrationNo: string
  model: string
  capacity: number
  driverName: string
  status: string
}

export function VehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicle?: VehicleRow | null
  onSaved?: () => void
}) {
  const { create, update } = useVehicleMutations(onSaved)

  const form = useForm<VehicleValues>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      registrationNo: "",
      model: "",
      capacity: 30,
      driverName: "",
      driverPhone: "",
      conductorName: "",
      status: "ACTIVE",
      lastServiceAt: "",
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      registrationNo: vehicle?.registrationNo ?? "",
      model: vehicle?.model ?? "",
      capacity: vehicle?.capacity ?? 30,
      driverName: vehicle?.driverName ?? "",
      driverPhone: "",
      conductorName: "",
      status: (vehicle?.status as VehicleValues["status"]) ?? "ACTIVE",
      lastServiceAt: "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicle])

  const submit = form.handleSubmit(async (values) => {
    try {
      const payload = {
        ...values,
        conductorName: values.conductorName.trim() || null,
        lastServiceAt: values.lastServiceAt || null,
      }
      if (vehicle) {
        // Editing does not resend the phone/conductor the row does not carry.
        await update.mutate({
          id: vehicle.id,
          registrationNo: payload.registrationNo,
          model: payload.model,
          capacity: payload.capacity,
          driverName: payload.driverName,
          status: payload.status,
          ...(payload.driverPhone ? { driverPhone: payload.driverPhone } : {}),
          ...(payload.lastServiceAt ? { lastServiceAt: payload.lastServiceAt } : {}),
        })
        toast.success("Vehicle updated")
      } else {
        await create.mutate(payload)
        toast.success("Vehicle added")
      }
      onOpenChange(false)
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Could not save the vehicle" })
    }
  })

  const rootError = rootErrorOf(form)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{vehicle ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
          <DialogDescription>
            Capacity is enforced when learners are assigned — a route can never overbook a bus.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="registrationNo"
              render={({ field }) => (
                <FormItem>
                  <Label>Registration</Label>
                  <Input placeholder="ICT-1234" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <Label>Model</Label>
                  <Input placeholder="Coaster 2024" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <Label>Seats</Label>
                  <Input type="number" min={1} {...field} />
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
                      {VEHICLE_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.replace(/_/g, " ").toLowerCase()}
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
              name="driverName"
              render={({ field }) => (
                <FormItem>
                  <Label>Driver</Label>
                  <Input placeholder="Akram Ali" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="driverPhone"
              render={({ field }) => (
                <FormItem>
                  <Label>Driver phone</Label>
                  <Input placeholder="+92 300 1234567" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="conductorName"
              render={({ field }) => (
                <FormItem>
                  <Label>Conductor (optional)</Label>
                  <Input {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastServiceAt"
              render={({ field }) => (
                <FormItem>
                  <Label>Last service</Label>
                  <Input type="date" {...field} />
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
              {vehicle ? "Save changes" : "Add vehicle"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
//  Route
// ─────────────────────────────────────────────────────────────

export interface RouteRowSummary {
  id: string
  name: string
  startPoint: string
  endPoint: string
  distanceKm: number
  monthlyFee: number
  isActive: boolean
}

export function RouteDialog({
  open,
  onOpenChange,
  route,
  vehicles,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  route?: RouteRowSummary | null
  vehicles: VehicleRow[]
  onSaved?: () => void
}) {
  const { create, update } = useRouteMutations(onSaved)

  const form = useForm<RouteValues>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      name: "",
      startPoint: "",
      endPoint: "",
      distanceKm: 0,
      monthlyFee: 0,
      vehicleId: "",
      isActive: true,
    },
  })

  useEffect(() => {
    if (!open) return
    form.reset({
      name: route?.name ?? "",
      startPoint: route?.startPoint ?? "",
      endPoint: route?.endPoint ?? "",
      distanceKm: route?.distanceKm ?? 0,
      monthlyFee: route?.monthlyFee ?? 0,
      vehicleId: "",
      isActive: route?.isActive ?? true,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, route])

  const submit = form.handleSubmit(async (values) => {
    try {
      const payload = { ...values, vehicleId: values.vehicleId || null }
      if (route) {
        await update.mutate({ id: route.id, ...payload })
        toast.success("Route updated")
      } else {
        await create.mutate(payload)
        toast.success("Route created")
      }
      onOpenChange(false)
    } catch (err) {
      form.setError("root", { message: err instanceof Error ? err.message : "Could not save the route" })
    }
  })

  const rootError = rootErrorOf(form)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{route ? "Edit route" : "New route"}</DialogTitle>
          <DialogDescription>Assign a vehicle to enforce its seat limit on this route.</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <Label>Route name</Label>
                <Input placeholder="Route 01 — F-10 / G-9" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startPoint"
              render={({ field }) => (
                <FormItem>
                  <Label>Start point</Label>
                  <Input placeholder="F-10 Markaz" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endPoint"
              render={({ field }) => (
                <FormItem>
                  <Label>End point</Label>
                  <Input placeholder="School gate" {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="distanceKm"
              render={({ field }) => (
                <FormItem>
                  <Label>Distance (km)</Label>
                  <Input type="number" min={0} step={0.5} {...field} />
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
                  <Input type="number" min={0} step={100} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <Label>Vehicle</Label>
                <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="No vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No vehicle</SelectItem>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.registrationNo} · {vehicle.capacity} seats
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
              {route ? "Save changes" : "Create route"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
