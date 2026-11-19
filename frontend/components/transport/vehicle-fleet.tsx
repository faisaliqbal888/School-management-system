"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Bus, Fuel, Settings, AlertTriangle } from "lucide-react"

const vehicles = [
  {
    id: "V001",
    number: "Bus #101",
    type: "School Bus",
    capacity: 50,
    driver: "Robert Wilson",
    phone: "+1 234 567 8901",
    fuelLevel: 85,
    lastService: "2024-10-15",
    nextService: "2024-12-15",
    status: "active",
    mileage: "45,230 km",
  },
  {
    id: "V002",
    number: "Bus #102",
    type: "School Bus",
    capacity: 45,
    driver: "James Miller",
    phone: "+1 234 567 8902",
    fuelLevel: 62,
    lastService: "2024-09-20",
    nextService: "2024-11-20",
    status: "active",
    mileage: "52,180 km",
  },
  {
    id: "V003",
    number: "Bus #103",
    type: "Mini Bus",
    capacity: 30,
    driver: "David Brown",
    phone: "+1 234 567 8903",
    fuelLevel: 38,
    lastService: "2024-11-01",
    nextService: "2025-01-01",
    status: "active",
    mileage: "38,450 km",
  },
  {
    id: "V004",
    number: "Bus #104",
    type: "School Bus",
    capacity: 55,
    driver: "Michael Lee",
    phone: "+1 234 567 8904",
    fuelLevel: 15,
    lastService: "2024-08-10",
    nextService: "2024-10-10",
    status: "maintenance",
    mileage: "68,920 km",
  },
]

export function VehicleFleet() {
  return (
    <Card className="border-none shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">Vehicle Fleet</CardTitle>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <Settings className="h-4 w-4" />
          Manage Fleet
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Vehicle</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Fuel</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vehicles.map((vehicle) => (
              <TableRow key={vehicle.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Bus className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{vehicle.number}</p>
                      <p className="text-xs text-muted-foreground">
                        {vehicle.type} | {vehicle.mileage}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-sm">{vehicle.driver}</p>
                    <p className="text-xs text-muted-foreground">{vehicle.phone}</p>
                  </div>
                </TableCell>
                <TableCell>{vehicle.capacity} seats</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Fuel
                      className={`h-4 w-4 ${vehicle.fuelLevel < 25 ? "text-rose-500" : vehicle.fuelLevel < 50 ? "text-amber-500" : "text-emerald-500"}`}
                    />
                    <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${vehicle.fuelLevel < 25 ? "bg-rose-500" : vehicle.fuelLevel < 50 ? "bg-amber-500" : "bg-emerald-500"}`}
                        style={{ width: `${vehicle.fuelLevel}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{vehicle.fuelLevel}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Next: {vehicle.nextService}</p>
                    {new Date(vehicle.nextService) < new Date() && (
                      <Badge variant="destructive" className="mt-1 gap-1 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Overdue
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={vehicle.status === "active" ? "default" : "secondary"}
                    className={
                      vehicle.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }
                  >
                    {vehicle.status === "active" ? "Active" : "Maintenance"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
