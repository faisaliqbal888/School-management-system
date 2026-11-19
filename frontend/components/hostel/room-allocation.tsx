"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Bed, CheckCircle, XCircle } from "lucide-react"

const rooms = [
  { id: "R101", block: "A", floor: 1, capacity: 4, occupied: 4, type: "Standard", status: "full" },
  { id: "R102", block: "A", floor: 1, capacity: 4, occupied: 3, type: "Standard", status: "available" },
  { id: "R103", block: "A", floor: 1, capacity: 2, occupied: 2, type: "Premium", status: "full" },
  { id: "R104", block: "A", floor: 1, capacity: 4, occupied: 0, type: "Standard", status: "available" },
  { id: "R201", block: "A", floor: 2, capacity: 4, occupied: 4, type: "Standard", status: "full" },
  { id: "R202", block: "A", floor: 2, capacity: 2, occupied: 1, type: "Premium", status: "available" },
  { id: "R203", block: "A", floor: 2, capacity: 4, occupied: 2, type: "Standard", status: "available" },
  { id: "R204", block: "A", floor: 2, capacity: 4, occupied: 4, type: "Standard", status: "full" },
  { id: "R301", block: "B", floor: 1, capacity: 4, occupied: 3, type: "Standard", status: "available" },
  { id: "R302", block: "B", floor: 1, capacity: 2, occupied: 0, type: "Premium", status: "available" },
  { id: "R303", block: "B", floor: 1, capacity: 4, occupied: 4, type: "Standard", status: "full" },
  { id: "R304", block: "B", floor: 1, capacity: 4, occupied: 1, type: "Standard", status: "available" },
]

export function RoomAllocation() {
  const [searchQuery, setSearchQuery] = useState("")
  const [blockFilter, setBlockFilter] = useState("all")

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesBlock = blockFilter === "all" || room.block === blockFilter
    return matchesSearch && matchesBlock
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search rooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={blockFilter} onValueChange={setBlockFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Block" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Blocks</SelectItem>
            <SelectItem value="A">Block A</SelectItem>
            <SelectItem value="B">Block B</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredRooms.map((room) => (
          <Card
            key={room.id}
            className={`border-none shadow-sm hover:shadow-md transition-all cursor-pointer ${
              room.status === "full" ? "opacity-60" : ""
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">{room.id}</span>
                {room.status === "full" ? (
                  <XCircle className="h-5 w-5 text-rose-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bed className="h-4 w-4" />
                  <span>
                    {room.occupied}/{room.capacity} beds
                  </span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: room.capacity }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-2 flex-1 rounded-full ${i < room.occupied ? "bg-primary" : "bg-muted"}`}
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {room.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Floor {room.floor}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
