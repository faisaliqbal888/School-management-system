"use client"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { BedDouble, Building2, Loader2, Pencil, Plus, Users, Wallet } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { money, useHostelOverview } from "@/lib/hooks/use-operations"
import { useState } from "react"
import { AllocateDialog, RoomDialog } from "@/components/operations/hostel-dialogs"
import { cn } from "@/lib/utils"

export default function AdminHostelPage() {
  const { ready } = useRequireRole("ADMIN")
  const { overview, isLoading, error, refetch } = useHostelOverview()

  const [roomOpen, setRoomOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<(typeof rooms)[number] | null>(null)
  const [allocateRoom, setAllocateRoom] = useState<(typeof rooms)[number] | null>(null)

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const rooms = overview?.rooms ?? []
  const blocks = [...new Set(rooms.map((room) => room.block))].sort()

  const stats = [
    { label: "Beds", value: overview?.beds ?? 0, icon: BedDouble, tone: "bg-blue-50 text-blue-600" },
    { label: "Occupied", value: overview?.occupied ?? 0, icon: Users, tone: "bg-emerald-50 text-emerald-600" },
    { label: "Blocks", value: blocks.length, icon: Building2, tone: "bg-violet-50 text-violet-600" },
    {
      label: "Monthly revenue",
      value: `PKR ${money(overview?.monthlyRevenue ?? 0)}`,
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Hostel</h1>
            <p className="text-muted-foreground">
              {overview?.occupancyRate !== null && overview?.occupancyRate !== undefined
                ? `${overview.occupancyRate}% occupancy · ${overview.activeAllocations} active allocations`
                  : "Room allocation and occupancy"}
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingRoom(null)
                setRoomOpen(true)
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add room
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", stat.tone)}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{isLoading ? "—" : stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-36 w-full" />
              ))}
            </div>
          ) : (
            blocks.map((block) => {
              const blockRooms = rooms.filter((room) => room.block === block)
              const beds = blockRooms.reduce((sum, room) => sum + room.capacity, 0)
              const occupied = blockRooms.reduce((sum, room) => sum + room.occupied, 0)

              return (
                <Card key={block}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-base">
                      <span>Block {block}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {occupied}/{beds} beds · {blockRooms.length} rooms
                      </span>
                    </CardTitle>
                    <Progress value={beds === 0 ? 0 : (occupied / beds) * 100} className="mt-2 h-1.5" />
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {blockRooms.map((room) => (
                      <div key={room.id} className="rounded-lg border p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{room.roomNo}</p>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-[10px]">
                              {room.type.toLowerCase()}
                            </Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              aria-label={`Edit room ${room.roomNo}`}
                              onClick={() => {
                                setEditingRoom(room)
                                setRoomOpen(true)
                              }}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {room.occupied}/{room.capacity} beds · PKR {money(room.monthlyFee)}/mo
                        </p>

                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-7 w-full text-xs"
                          onClick={() => setAllocateRoom(room)}
                        >
                          Manage beds
                        </Button>

                        {room.residents.length === 0 ? (
                          <p className="mt-2 text-xs text-muted-foreground">Empty</p>
                        ) : (
                          <ul className="mt-2 space-y-1">
                            {room.residents.map((resident) => (
                              <li key={resident.allocationId} className="truncate text-xs">
                                <span className="font-medium">{resident.name}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  · {resident.className ?? "—"}
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })
          )}

          {!isLoading && rooms.length === 0 && !error && (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">
                No hostel rooms have been created.
              </CardContent>
            </Card>
          )}
          <RoomDialog open={roomOpen} onOpenChange={setRoomOpen} room={editingRoom} onSaved={refetch} />
          <AllocateDialog
            open={allocateRoom !== null}
            onOpenChange={(next) => !next && setAllocateRoom(null)}
            room={allocateRoom}
            onSaved={refetch}
          />
        </main>
      </div>
    </div>
  )
}
