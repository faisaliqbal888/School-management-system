import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { RouteMap } from "@/components/transport/route-map"
import { VehicleFleet } from "@/components/transport/vehicle-fleet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Bus, Route, Users, MapPin } from "lucide-react"

const stats = [
  { title: "Total Vehicles", value: "12", icon: Bus, color: "text-primary", bgColor: "bg-primary/10" },
  { title: "Active Routes", value: "8", icon: Route, color: "text-emerald-600", bgColor: "bg-emerald-500/10" },
  { title: "Students Using", value: "342", icon: Users, color: "text-amber-600", bgColor: "bg-amber-500/10" },
  { title: "Total Stops", value: "45", icon: MapPin, color: "text-purple-600", bgColor: "bg-purple-500/10" },
]

export default function TransportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Transport Management</h1>
              <p className="text-muted-foreground">Manage routes, vehicles, and student transportation</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Route
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-none shadow-sm">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="routes" className="space-y-6">
            <TabsList>
              <TabsTrigger value="routes">Routes & Tracking</TabsTrigger>
              <TabsTrigger value="fleet">Vehicle Fleet</TabsTrigger>
            </TabsList>

            <TabsContent value="routes">
              <RouteMap />
            </TabsContent>

            <TabsContent value="fleet">
              <VehicleFleet />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
