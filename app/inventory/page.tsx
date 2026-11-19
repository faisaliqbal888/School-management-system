import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { InventoryTable } from "@/components/inventory/inventory-table"
import { InventoryStats } from "@/components/inventory/inventory-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Download } from "lucide-react"

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Inventory Management</h1>
              <p className="text-muted-foreground">Track and manage school inventory and supplies</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="all-items">All Items</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <InventoryStats />
            </TabsContent>

            <TabsContent value="all-items">
              <InventoryTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
