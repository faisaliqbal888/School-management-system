"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Printer,
  GraduationCap,
  CreditCard,
  ClipboardCheck,
  FileText,
  TrendingUp,
  AlertCircle,
  Droplet,
  User,
} from "lucide-react"
import { useStudent } from "@/lib/hooks/use-students"
import { formatPKR, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

interface StudentDetailModalProps {
  studentId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdated?: () => void
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-gray-100 text-gray-600",
  PENDING: "bg-amber-100 text-amber-700",
  GRADUATED: "bg-blue-100 text-blue-700",
  TRANSFERRED: "bg-violet-100 text-violet-700",
  WITHDRAWN: "bg-red-100 text-red-700",
}

const ATTENDANCE_STYLES: Record<string, string> = {
  PRESENT: "bg-emerald-500",
  LATE: "bg-amber-500",
  ABSENT: "bg-red-500",
  EXCUSED: "bg-blue-500",
  HOLIDAY: "bg-gray-300",
}

export function StudentDetailModal({
  studentId,
  open,
  onOpenChange,
  onUpdated,
}: StudentDetailModalProps) {
  const { student, isLoading, error } = useStudent(open ? studentId : null)
  const [tab, setTab] = useState("overview")

  const print = () => window.print()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-full max-w-4xl overflow-y-auto border-0 p-0 shadow-2xl">
        <DialogTitle className="sr-only">
          Student Details{student ? `: ${student.name}` : ""}
        </DialogTitle>

        {/* header */}
        <div className="relative rounded-t-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-6 text-white">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 ring-4 ring-white/30">
              <AvatarImage src={student?.avatarUrl ?? "/placeholder.svg"} />
              <AvatarFallback className="bg-white/20 text-2xl text-white">
                {student?.name
                  ?.split(" ")
                  .slice(0, 2)
                  .map((n) => n[0]?.toUpperCase())
                  .join("") ?? "ST"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-48 bg-white/20" />
                  <Skeleton className="h-4 w-32 bg-white/20" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold">{student?.name}</h2>
                    {student && (
                      <Badge className={cn("border-0", STATUS_STYLES[student.status])}>
                        {student.status}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/80">
                    {student?.admissionNo}
                    {student?.rollNo ? ` · Roll ${student.rollNo}` : ""}
                    {student?.class ? ` · ${student.class.name}` : ""}
                    {student?.section ? `-${student.section.name}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/90">
                    {student?.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {student.email}
                      </span>
                    )}
                    {student?.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {student.phone}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={print}
              className="text-white hover:bg-white/20 hover:text-white"
            >
              <Printer className="mr-1.5 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>

        {/* body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 text-destructive" />
              <span>{error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : student ? (
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="academics">Academics</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="fees">Fees</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoCard icon={User} title="Personal">
                    <Row label="Full name" value={student.name} />
                    <Row label="Admission no" value={student.admissionNo} />
                    <Row label="Date of birth" value={formatDate(student.dateOfBirth)} />
                    <Row
                      label="Gender"
                      value={
                        student.gender === "MALE"
                          ? "Male"
                          : student.gender === "FEMALE"
                            ? "Female"
                            : "Other"
                      }
                    />
                    <Row label="Blood group" value={student.bloodGroup ?? "—"} />
                  </InfoCard>

                  <InfoCard icon={MapPin} title="Contact">
                    <Row label="Email" value={student.email} />
                    <Row label="Phone" value={student.phone ?? "—"} />
                    <Row label="Address" value={student.address ?? "—"} />
                    <Row label="City" value={student.city ?? "—"} />
                    <Row label="Admitted" value={formatDate(student.admissionDate)} />
                  </InfoCard>

                  <InfoCard icon={GraduationCap} title="Academic">
                    <Row label="Class" value={student.class?.name ?? "Not assigned"} />
                    <Row
                      label="Section"
                      value={student.section ? `Section ${student.section.name}` : "—"}
                    />
                    <Row label="Academic year" value={student.academicYear ?? "—"} />
                    <Row label="Roll no" value={student.rollNo ?? "—"} />
                    <Row
                      label="Average"
                      value={student.averagePercent !== null ? `${student.averagePercent}%` : "—"}
                    />
                  </InfoCard>

                  <InfoCard icon={Phone} title="Guardian">
                    {student.guardians.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No guardian recorded</p>
                    ) : (
                      student.guardians.map((g) => (
                        <div key={g.id} className="space-y-1">
                          <p className="font-medium">
                            {g.name}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              ({g.relation})
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">{g.phone}</p>
                          {g.email && <p className="text-xs text-muted-foreground">{g.email}</p>}
                          {g.occupation && (
                            <p className="text-xs text-muted-foreground">{g.occupation}</p>
                          )}
                        </div>
                      ))
                    )}
                  </InfoCard>
                </div>
              </TabsContent>

              {/* ACADEMICS */}
              <TabsContent value="academics" className="mt-5 space-y-4">
                {student.averagePercent !== null && (
                  <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                        <TrendingUp className="h-7 w-7" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Average across recorded exams</p>
                        <p className="text-2xl font-bold">{student.averagePercent}%</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {student.results.length === 0 ? (
                  <EmptyState icon={FileText} message="No exam results recorded yet." />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Exam</th>
                          <th className="px-4 py-2 text-left font-medium">Subject</th>
                          <th className="px-4 py-2 text-right font-medium">Marks</th>
                          <th className="px-4 py-2 text-right font-medium">Grade</th>
                          <th className="px-4 py-2 text-right font-medium">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.results.map((r) => (
                          <tr key={r.id} className="border-t border-border">
                            <td className="px-4 py-2">{r.exam}</td>
                            <td className="px-4 py-2">{r.subject}</td>
                            <td className="px-4 py-2 text-right font-mono">
                              {r.marks}/{r.totalMarks}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Badge variant="secondary">{r.grade ?? "—"}</Badge>
                            </td>
                            <td className="px-4 py-2 text-right text-muted-foreground">
                              {formatDate(r.date)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              {/* ATTENDANCE */}
              <TabsContent value="attendance" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatBox
                    icon={ClipboardCheck}
                    label="Attendance rate"
                    value={student.attendance.rate !== null ? `${student.attendance.rate}%` : "—"}
                    tone="emerald"
                  />
                  <StatBox
                    icon={Calendar}
                    label="Recorded days"
                    value={String(student.attendance.sampleDays)}
                    tone="blue"
                  />
                  <StatBox
                    icon={Droplet}
                    label="Present days"
                    value={String(student.attendance.presentDays)}
                    tone="violet"
                  />
                </div>

                {student.attendance.recent.length === 0 ? (
                  <EmptyState icon={Calendar} message="No attendance recorded yet." />
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recent days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1.5">
                        {student.attendance.recent.map((d) => (
                          <div
                            key={d.date}
                            title={`${formatDate(d.date)} — ${d.status}`}
                            className={cn(
                              "h-8 w-8 rounded-md",
                              ATTENDANCE_STYLES[d.status] ?? "bg-gray-300",
                            )}
                          />
                        ))}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                        {Object.entries(ATTENDANCE_STYLES).map(([status, color]) => (
                          <span key={status} className="flex items-center gap-1.5">
                            <span className={cn("h-3 w-3 rounded", color)} />
                            {status.charAt(0) + status.slice(1).toLowerCase()}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* FEES */}
              <TabsContent value="fees" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <StatBox
                    icon={CreditCard}
                    label="Total billed"
                    value={formatPKR(student.fees.totalBilled)}
                    tone="blue"
                  />
                  <StatBox
                    icon={CreditCard}
                    label="Paid"
                    value={formatPKR(student.fees.totalPaid)}
                    tone="emerald"
                  />
                  <StatBox
                    icon={CreditCard}
                    label="Outstanding"
                    value={formatPKR(student.fees.outstanding)}
                    tone={student.fees.outstanding > 0 ? "red" : "emerald"}
                  />
                </div>

                {student.fees.invoices.length === 0 ? (
                  <EmptyState icon={CreditCard} message="No invoices raised yet." />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Invoice</th>
                          <th className="px-4 py-2 text-left font-medium">Title</th>
                          <th className="px-4 py-2 text-right font-medium">Amount</th>
                          <th className="px-4 py-2 text-right font-medium">Paid</th>
                          <th className="px-4 py-2 text-right font-medium">Due</th>
                          <th className="px-4 py-2 text-right font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {student.fees.invoices.map((i) => (
                          <tr key={i.id} className="border-t border-border">
                            <td className="px-4 py-2 font-mono text-xs">{i.invoiceNo}</td>
                            <td className="px-4 py-2">{i.title}</td>
                            <td className="px-4 py-2 text-right">{formatPKR(i.amount)}</td>
                            <td className="px-4 py-2 text-right">{formatPKR(i.paid)}</td>
                            <td className="px-4 py-2 text-right text-muted-foreground">
                              {formatDate(i.dueDate)}
                            </td>
                            <td className="px-4 py-2 text-right">
                              <Badge
                                variant={i.status === "PAID" ? "secondary" : "outline"}
                                className={i.status === "PAID" ? "text-emerald-600" : ""}
                              >
                                {i.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType
  title: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2 pb-2">
        <Icon className="h-4 w-4 text-primary" />
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">{children}</CardContent>
    </Card>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  )
}

function StatBox({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  tone: "emerald" | "blue" | "violet" | "red"
}) {
  const tones = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    red: "bg-red-50 text-red-600",
  }
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tones[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
