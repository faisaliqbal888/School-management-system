"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  BookOpen,
  Briefcase,
  Calendar,
  CreditCard,
  GraduationCap,
  Mail,
  Phone,
  Printer,
  Users,
} from "lucide-react"
import { formatDate, formatPKR } from "@/lib/format"
import { useTeacher } from "@/lib/hooks/use-teachers"
import { cn } from "@/lib/utils"

interface TeacherDetailModalProps {
  teacherId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ON_LEAVE: "bg-amber-100 text-amber-700",
  RESIGNED: "bg-slate-100 text-slate-600",
  TERMINATED: "bg-red-100 text-red-700",
}

export function TeacherDetailModal({ teacherId, open, onOpenChange }: TeacherDetailModalProps) {
  const { teacher, isLoading, error } = useTeacher(open ? teacherId : null)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-0 p-0 shadow-2xl">
        <DialogTitle className="sr-only">
          Teacher profile{teacher ? `: ${teacher.name}` : ""}
        </DialogTitle>

        {/* header */}
        <div className="relative rounded-t-lg bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 p-6 text-white">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 ring-4 ring-white/30">
              <AvatarImage src={teacher?.avatarUrl ?? undefined} alt={teacher?.name} />
              <AvatarFallback className="bg-white/20 text-2xl text-white">
                {teacher?.name
                  ?.split(" ")
                  .slice(0, 2)
                  .map((n) => n[0]?.toUpperCase())
                  .join("") ?? "TR"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-44 bg-white/20" />
                  <Skeleton className="h-4 w-32 bg-white/20" />
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold">{teacher?.name}</h2>
                    {teacher && (
                      <Badge className={cn("border-0", STATUS_STYLES[teacher.status])}>
                        {teacher.status.replace("_", " ")}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-white/80">
                    {teacher?.employeeNo} · {teacher?.designation} · {teacher?.department}
                    {teacher?.classTeacherOf ? ` · Class teacher of ${teacher.classTeacherOf}` : ""}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/90">
                    {teacher?.email && (
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {teacher.email}
                      </span>
                    )}
                    {teacher?.phone && (
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        {teacher.phone}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.print()}
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
            <div className="grid gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : teacher ? (
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="classes">Classes</TabsTrigger>
                <TabsTrigger value="payroll">Payroll</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat icon={BookOpen} label="Sections" value={String(teacher.sectionCount)} tone="violet" />
                  <Stat icon={Users} label="Students" value={String(teacher.studentCount)} tone="blue" />
                  <Stat icon={Calendar} label="Weekly periods" value={String(teacher.timetableLoad)} tone="emerald" />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <Briefcase className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold">Employment</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <Row label="Employee no" value={teacher.employeeNo} />
                      <Row label="Department" value={teacher.department} />
                      <Row label="Designation" value={teacher.designation} />
                      <Row label="Type" value={teacher.employmentType.replace("_", " ")} />
                      <Row label="Joining date" value={formatDate(teacher.joiningDate)} />
                      <Row label="Qualification" value={teacher.qualification ?? "—"} />
                      <Row label="Specialization" value={teacher.specialization ?? "—"} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center gap-2 pb-2">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm font-semibold">Teaching</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <Row
                        label="Subjects"
                        value={teacher.subjects.length ? teacher.subjects.join(", ") : "—"}
                      />
                      <Row label="Class teacher" value={teacher.classTeacherOf ?? "—"} />
                      <Row label="Base salary" value={formatPKR(teacher.baseSalary)} />
                      <Row
                        label="Latest payslip"
                        value={
                          teacher.payrollLatest
                            ? `${teacher.payrollLatest.period} · ${formatPKR(teacher.payrollLatest.net)}`
                            : "Not processed"
                        }
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="classes" className="mt-5 space-y-4">
                {teacher.classes.length === 0 ? (
                  <Empty icon={BookOpen} message="No sections assigned yet." />
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/40">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium">Class</th>
                          <th className="px-4 py-2 text-left font-medium">Section</th>
                          <th className="px-4 py-2 text-left font-medium">Subject</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teacher.subjectAssignments.length > 0 ? (
                          teacher.subjectAssignments.map((a) => (
                            <tr key={a.id} className="border-t border-border">
                              <td className="px-4 py-2">{a.className}</td>
                              <td className="px-4 py-2">{a.sectionName ?? "—"}</td>
                              <td className="px-4 py-2">{a.subject}</td>
                            </tr>
                          ))
                        ) : (
                          teacher.classes.map((c) => (
                            <tr key={`${c.id}-${c.section}`} className="border-t border-border">
                              <td className="px-4 py-2">{c.name}</td>
                              <td className="px-4 py-2">{c.section ?? "—"}</td>
                              <td className="px-4 py-2 text-muted-foreground">Timetable only</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payroll" className="mt-5 space-y-4">
                <Card>
                  <CardHeader className="flex flex-row items-center gap-2 pb-2">
                    <CreditCard className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Latest payslip</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teacher.payrollLatest ? (
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="text-2xl font-bold">{formatPKR(teacher.payrollLatest.net)}</p>
                          <p className="text-xs text-muted-foreground">
                            Period {teacher.payrollLatest.period}
                          </p>
                        </div>
                        <Badge variant="outline">{teacher.payrollLatest.status}</Badge>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No payroll has been processed for this teacher yet.
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Recent leave requests</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {teacher.leaveRequests.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No leave requests recorded.</p>
                    ) : (
                      teacher.leaveRequests.map((l) => (
                        <div
                          key={l.id}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border p-2.5 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate">{l.reason}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(l.from)} → {formatDate(l.to)}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 text-[10px]">
                            {l.status}
                          </Badge>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
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

function Stat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ElementType
  label: string
  value: string
  tone: "violet" | "blue" | "emerald"
}) {
  const tones = {
    violet: "bg-violet-50 text-violet-600",
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
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

function Empty({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border py-10 text-center">
      <Icon className="h-6 w-6 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
