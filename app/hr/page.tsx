import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { PayrollTable } from "@/components/hr/payroll-table"
import { HRStats } from "@/components/hr/hr-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Plus, Calculator } from "lucide-react"

export default function HRPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">HR & Payroll</h1>
              <p className="text-muted-foreground">Manage employee payroll and human resources</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Calculator className="h-4 w-4" />
                Generate Payroll
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="payroll">Payroll</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <HRStats />
            </TabsContent>

            <TabsContent value="payroll">
              <PayrollTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
