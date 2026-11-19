"use client"

import { useEffect, useState } from "react"
import { useStaff } from "../../../lib/hooks/useStaff"
import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Loader2, Users, DollarSign, Calendar, TrendingUp, Plus, Download } from "lucide-react"

const stats = [
  { title: "Total Staff", value: "248", icon: Users, color: "bg-primary/10 text-primary" },
  { title: "Monthly Payroll", value: "$124,500", icon: DollarSign, color: "bg-success/10 text-success" },
  { title: "On Leave Today", value: "5", icon: Calendar, color: "bg-warning/10 text-warning" },
  { title: "Attendance Rate", value: "94.2%", icon: TrendingUp, color: "bg-accent/10 text-accent" },
]

// Staff will be fetched from the API via SWR hook
// Payroll will be fetched from the payroll API route

const leaveData = [
  { id: 1, name: "Sara Ahmed", type: "Casual Leave", from: "Dec 10, 2024", to: "Dec 12, 2024", days: 3, status: "Approved" },
  { id: 2, name: "Ali Hassan", type: "Medical Leave", from: "Dec 08, 2024", to: "Dec 08, 2024", days: 1, status: "Pending" },
  { id: 3, name: "Hassan Khan", type: "Annual Leave", from: "Dec 20, 2024", to: "Dec 27, 2024", days: 8, status: "Approved" },
  { id: 4, name: "Maryam Khan", type: "Casual Leave", from: "Dec 15, 2024", to: "Dec 16, 2024", days: 2, status: "Pending" },
]

export default function AdminHRPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState("staff")
  const { staff, isLoading: staffLoading } = useStaff()
  const [payroll, setPayroll] = useState<any[]>([])

  useEffect(() => {
    async function loadPayroll() {
      try {
        const res = await fetch('/api/admin/payroll')
        if (res.ok) {
          const data = await res.json()
          setPayroll(data)
        }
      } catch (e) {
        // ignore
      }
    }
    loadPayroll()
  }, [])

  function downloadCSV(data: any[], filename = 'payroll.csv') {
    if (!data || data.length === 0) return
    const headers = ['Month', 'Base Salary', 'Allowances', 'Deductions', 'Total', 'Status']
    const rows = data.map((p) => [p.month, p.base, p.allowances, p.deductions, p.total, p.status])
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const { ready } = useRequireRole("ADMIN")

  if (!ready) return <FullPageLoader />

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">HR & Payroll</h1>
              <p className="text-muted-foreground">Manage HR and payroll operations</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Staff Member
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>HR Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="staff">Staff Directory</TabsTrigger>
                  <TabsTrigger value="payroll">Payroll</TabsTrigger>
                  <TabsTrigger value="leave">Leave Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="staff" className="space-y-4 mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">Name</th>
                          <th className="text-left py-3 px-4 font-semibold">Position</th>
                          <th className="text-left py-3 px-4 font-semibold">Department</th>
                          <th className="text-left py-3 px-4 font-semibold">Salary</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {staffLoading ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center">Loading staff…</td>
                          </tr>
                        ) : (
                          staff.map((s: any) => (
                            <tr key={s.id} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                                      {s.name?.split(" ").map((n: string) => n[0]).join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{s.name}</p>
                                    <p className="text-xs text-muted-foreground">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-4">{s.position || s.role}</td>
                              <td className="py-3 px-4">{s.department}</td>
                              <td className="py-3 px-4 font-medium">{s.salary || s.salaryFormatted || '-'}</td>
                              <td className="py-3 px-4">
                                <Badge className={s.status === "Active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                                  {s.status || 'Active'}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="payroll" className="space-y-4 mt-4">
                  <Button className="mb-4" onClick={() => downloadCSV(payroll)}>
                    <Download className="mr-2 h-4 w-4" />
                    Download Payroll Report
                  </Button>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left py-3 px-4 font-semibold">Month</th>
                          <th className="text-left py-3 px-4 font-semibold">Base Salary</th>
                          <th className="text-left py-3 px-4 font-semibold">Allowances</th>
                          <th className="text-left py-3 px-4 font-semibold">Deductions</th>
                          <th className="text-left py-3 px-4 font-semibold">Total</th>
                          <th className="text-left py-3 px-4 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payroll.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center">No payroll data available</td>
                          </tr>
                        ) : (
                          payroll.map((p, idx) => (
                            <tr key={idx} className="border-b hover:bg-muted/50 transition-colors">
                              <td className="py-3 px-4 font-medium">{p.month}</td>
                              <td className="py-3 px-4">{p.base}</td>
                              <td className="py-3 px-4 text-green-600">{p.allowances}</td>
                              <td className="py-3 px-4 text-red-600">{p.deductions}</td>
                              <td className="py-3 px-4 font-bold">{p.total}</td>
                              <td className="py-3 px-4">
                                <Badge className={p.status === "Paid" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                                  {p.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                <TabsContent value="leave" className="space-y-4 mt-4">
                  <Button className="mb-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Process Leave Request
                  </Button>
                  <div className="space-y-3">
                    {leaveData.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <p className="font-medium">{request.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {request.type} - {request.days} days
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {request.from} to {request.to}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={request.status === "Approved" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                            {request.status}
                          </Badge>
                          <Button variant="outline" size="sm">
                            Manage
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}

/** Shared loading fallback while the session is being verified. */
function FullPageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
