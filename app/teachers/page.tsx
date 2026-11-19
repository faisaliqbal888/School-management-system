import { Sidebar } from "@/components/dashboard/sidebar"
import { Header } from "@/components/dashboard/header"
import { TeacherTable } from "@/components/teachers/teacher-table"
import { AddTeacherModal } from "@/components/teachers/add-teacher-modal"
import { DepartmentStats } from "@/components/teachers/department-stats"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TeachersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Teachers & Staff</h1>
              <p className="text-muted-foreground">Manage your teaching faculty and staff members</p>
            </div>
            <AddTeacherModal />
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="all-teachers">All Teachers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <DepartmentStats />
            </TabsContent>

            <TabsContent value="all-teachers">
              <TeacherTable />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
