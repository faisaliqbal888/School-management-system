import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { RoomAllocation } from "@/components/hostel/room-allocation"
import { HostelStats } from "@/components/hostel/hostel-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function HostelPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Hostel Management</h1>
              <p className="text-muted-foreground">Manage rooms, allocations, and hostel facilities</p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Allocate Room
            </Button>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="rooms">Room Allocation</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <HostelStats />
            </TabsContent>

            <TabsContent value="rooms">
              <RoomAllocation />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
