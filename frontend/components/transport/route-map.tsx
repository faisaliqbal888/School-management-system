"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bus, MapPin, Clock, Users } from "lucide-react"

const routes = [
  {
    id: "R001",
    name: "Route A - North Zone",
    vehicle: "Bus #101",
    driver: "Robert Wilson",
    stops: 12,
    students: 45,
    startTime: "7:00 AM",
    status: "active",
    color: "bg-blue-500",
  },
  {
    id: "R002",
    name: "Route B - South Zone",
    vehicle: "Bus #102",
    driver: "James Miller",
    stops: 10,
    students: 38,
    startTime: "7:15 AM",
    status: "active",
    color: "bg-emerald-500",
  },
  {
    id: "R003",
    name: "Route C - East Zone",
    vehicle: "Bus #103",
    driver: "David Brown",
    stops: 8,
    students: 32,
    startTime: "7:00 AM",
    status: "active",
    color: "bg-purple-500",
  },
  {
    id: "R004",
    name: "Route D - West Zone",
    vehicle: "Bus #104",
    driver: "Michael Lee",
    stops: 15,
    students: 52,
    startTime: "6:45 AM",
    status: "maintenance",
    color: "bg-amber-500",
  },
]

export function RouteMap() {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Live Route Tracking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[300px] bg-muted rounded-xl overflow-hidden">
            <img src="/city-map-bus-routes.png" alt="Route Map" className="object-cover w-full h-full opacity-80" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex gap-2 flex-wrap">
              {routes.map((route) => (
                <Badge key={route.id} className={`${route.color} text-white border-0`}>
                  {route.name.split(" - ")[0]}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.map((route) => (
          <Card key={route.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${route.color}/10`}>
                  <Bus className={`h-6 w-6 ${route.color.replace("bg-", "text-")}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{route.name}</h3>
                    <Badge
                      variant={route.status === "active" ? "default" : "secondary"}
                      className={
                        route.status === "active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }
                    >
                      {route.status === "active" ? "Active" : "Maintenance"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Bus className="h-4 w-4" />
                      <span>{route.vehicle}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{route.startTime}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{route.stops} stops</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{route.students} students</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Driver: {route.driver}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
