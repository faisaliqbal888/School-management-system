"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, DollarSign, Loader2, Users, Wallet } from "lucide-react"
import { useRequireRole } from "@/lib/auth-context"
import { useTeachers } from "@/lib/hooks/use-teachers"
import { money, useLeaveRequests, usePayroll } from "@/lib/hooks/use-operations"
import { useStaffDirectory } from "@/lib/hooks/use-admin"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const payrollTone: Record<string, string> = {
  PAID: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  DRAFT: "bg-slate-200 text-slate-700",
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" })

/** Payroll CSV, built from the rows already on screen. */
function downloadPayrollCsv(rows: { period: string; staffName: string; baseSalary: number; allowances: number; deductions: number; netPay: number; status: string }[]) {
  if (rows.length === 0) return
  const headers = ["Period", "Employee", "Base", "Allowances", "Deductions", "Net pay", "Status"]
  const lines = rows.map((row) => [
    row.period,
    row.staffName,
    row.baseSalary,
    row.allowances,
    row.deductions,
    row.netPay,
    row.status,
  ])
  const csv = [headers, ...lines]
    .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n")

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = `payroll-${rows[0]?.period ?? "report"}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function AdminHrPage() {
  const { ready } = useRequireRole("ADMIN")
  const [period, setPeriod] = useState<string | undefined>(undefined)

  const { staff: officeStaff, isLoading: staffLoading } = useStaffDirectory()
  const { teachers, isLoading: teachersLoading } = useTeachers({ limit: 100 } as never)

  /** One table for the whole payroll population: teaching + admin staff. */
  const directory = useMemo(
    () => [
      ...(teachers ?? []).map((teacher) => ({
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
        position: teacher.designation,
        department: teacher.department,
        kind: "Teacher" as const,
        status: teacher.status,
      })),
      ...officeStaff.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email ?? "—",
        position: member.position,
        department: member.department,
        kind: "Staff" as const,
        status: member.status,
      })),
    ],
    [teachers, officeStaff],
  )
  const directoryLoading = staffLoading || teachersLoading
  const { payroll, isLoading: payrollLoading } = usePayroll(period)
  const { leaves, isLoading: leavesLoading } = useLeaveRequests()

  const stats = useMemo(
    () => [
      {
        title: "Active staff",
        value: payroll ? payroll.headcount.staff + payroll.headcount.teachers : "—",
        hint: payroll ? `${payroll.headcount.teachers} teachers · ${payroll.headcount.staff} admin` : undefined,
        icon: Users,
        color: "bg-primary/10 text-primary",
      },
      {
        title: "Payroll (net)",
        value: payroll ? `PKR ${money(payroll.totals.net)}` : "—",
        hint: payroll?.period ? `period ${payroll.period}` : undefined,
        icon: DollarSign,
        color: "bg-success/10 text-success",
      },
      {
        title: "Pending leave",
        value: payroll?.pendingLeaves ?? 0,
        hint: "awaiting approval",
        icon: CalendarDays,
        color: "bg-warning/10 text-warning",
      },
      {
        title: "Draft payslips",
        value: payroll?.totals.draft ?? 0,
        hint: `${payroll?.totals.headcount ?? 0} payslips in this run`,
        icon: Wallet,
        color: "bg-accent/10 text-accent",
      },
    ],
    [payroll],
  )

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">HR &amp; Payroll</h1>
              <p className="text-muted-foreground">Staff directory, monthly payroll runs and leave requests</p>
            </div>
            <Button asChild>
              <Link href="/admin/teachers">Manage staff</Link>
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.title} className="border-0 shadow-sm">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-2xl font-bold">{stat.value}</p>
                    <p className="truncate text-sm text-muted-foreground">{stat.title}</p>
                    {stat.hint && <p className="truncate text-[11px] text-muted-foreground">{stat.hint}</p>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle>HR management</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="payroll" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="payroll">Payroll</TabsTrigger>
                  <TabsTrigger value="staff">Staff directory</TabsTrigger>
                  <TabsTrigger value="leave">Leave requests</TabsTrigger>
                </TabsList>

                {/* ── Payroll ─────────────────────────────── */}
                <TabsContent value="payroll" className="mt-4 space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <label htmlFor="payroll-period" className="text-sm text-muted-foreground">
                      Period
                    </label>
                    <select
                      id="payroll-period"
                      className="h-9 rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                      value={payroll?.period ?? ""}
                      onChange={(event) => setPeriod(event.target.value || undefined)}
                    >
                      {(payroll?.periods ?? []).map((entry) => (
                        <option key={entry} value={entry}>
                          {entry}
                        </option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        downloadPayrollCsv(payroll?.rows ?? [])
                        toast.success("Payroll CSV downloaded")
                      }}
                      disabled={(payroll?.rows.length ?? 0) === 0}
                    >
                      Download CSV
                    </Button>
                  </div>

                  {payrollLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : (payroll?.rows.length ?? 0) === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No payroll has been generated for this period.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold">Employee</th>
                            <th className="px-3 py-2 text-left font-semibold">Department</th>
                            <th className="px-3 py-2 text-right font-semibold">Base</th>
                            <th className="px-3 py-2 text-right font-semibold">Allowances</th>
                            <th className="px-3 py-2 text-right font-semibold">Deductions</th>
                            <th className="px-3 py-2 text-right font-semibold">Net</th>
                            <th className="px-3 py-2 text-left font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {payroll?.rows.map((row) => (
                            <tr key={row.id} className="border-b last:border-0">
                              <td className="px-3 py-2">
                                <p className="font-medium">{row.staffName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {row.employeeNo ?? "—"} · {row.staffType}
                                </p>
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">{row.department ?? "—"}</td>
                              <td className="px-3 py-2 text-right">{money(row.baseSalary)}</td>
                              <td className="px-3 py-2 text-right text-emerald-600">{money(row.allowances)}</td>
                              <td className="px-3 py-2 text-right text-rose-600">{money(row.deductions)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{money(row.netPay)}</td>
                              <td className="px-3 py-2">
                                <Badge className={payrollTone[row.status] ?? "bg-muted"}>
                                  {row.status.toLowerCase()}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </TabsContent>

                {/* ── Staff ───────────────────────────────── */}
                <TabsContent value="staff" className="mt-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-semibold">Name</th>
                          <th className="px-3 py-2 text-left font-semibold">Position</th>
                          <th className="px-3 py-2 text-left font-semibold">Department</th>
                          <th className="px-3 py-2 text-left font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {directoryLoading ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-muted-foreground">
                              Loading staff…
                            </td>
                          </tr>
                        ) : directory.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-muted-foreground">
                              No staff records found.
                            </td>
                          </tr>
                        ) : (
                          directory.map((record) => {
                            return (
                              <tr key={record.id} className="border-b transition-colors hover:bg-muted/50">
                                <td className="px-3 py-2">
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                      <AvatarFallback className="bg-primary text-xs font-bold text-primary-foreground">
                                        {record.name
                                          .split(" ")
                                          .map((part) => part[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium">{record.name}</p>
                                      <p className="text-xs text-muted-foreground">{record.email}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2">
                                  <p>{record.position}</p>
                                  <p className="text-xs text-muted-foreground">{record.kind}</p>
                                </td>
                                <td className="px-3 py-2 text-muted-foreground">{record.department}</td>
                                <td className="px-3 py-2">
                                  <Badge variant="secondary">{record.status.toLowerCase()}</Badge>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>

                {/* ── Leave ───────────────────────────────── */}
                <TabsContent value="leave" className="mt-4 space-y-3">
                  {leavesLoading ? (
                    <Skeleton className="h-24 w-full" />
                  ) : leaves.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No leave requests have been filed.
                    </p>
                  ) : (
                    leaves.map((request) => (
                      <div
                        key={request.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4"
                      >
                        <div className="min-w-0">
                          <p className="font-medium">{request.name}</p>
                          <p className="truncate text-sm text-muted-foreground">{request.reason}</p>
                          <p className="text-xs text-muted-foreground">
                            {shortDate(request.fromDate)} → {shortDate(request.toDate)}
                          </p>
                        </div>
                        <Badge variant={request.status === "PENDING" ? "outline" : "secondary"}>
                          {request.status.toLowerCase()}
                        </Badge>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
