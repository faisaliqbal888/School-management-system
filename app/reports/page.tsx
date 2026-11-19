import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { ReportDashboard } from "@/components/reports/report-dashboard"
import { Button } from "@/components/ui/button"
import { Plus, FileSpreadsheet } from "lucide-react"

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate and analyze school performance reports</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2 bg-transparent">
                <FileSpreadsheet className="h-4 w-4" />
                Export All
              </Button>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Custom Report
              </Button>
            </div>
          </div>

          <ReportDashboard />
        </main>
      </div>
    </div>
  )
}
