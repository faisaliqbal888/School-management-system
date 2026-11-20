"use client"

import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CheckCircle2, Copy, Key, Loader2, MoreVertical, Search, UserPlus, Users } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRequireRole } from "@/lib/auth-context"
import { useUserMutations, useUsers } from "@/lib/hooks/use-admin"
import { createUserSchema, type CreateUserValues } from "@/lib/validation/schemas"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const roles = ["STUDENT", "TEACHER", "PARENT", "ADMIN"] as const
const roleTone: Record<string, string> = {
  ADMIN: "bg-primary/10 text-primary",
  TEACHER: "bg-violet-100 text-violet-700",
  STUDENT: "bg-emerald-100 text-emerald-700",
  PARENT: "bg-amber-100 text-amber-700",
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")

export default function AdminUsersPage() {
  const { ready } = useRequireRole("ADMIN")
  const [search, setSearch] = useState("")
  const [role, setRole] = useState("")
  const [page, setPage] = useState(1)

  const [createOpen, setCreateOpen] = useState(false)
  const [issued, setIssued] = useState<{ name: string; password: string } | null>(null)

  const form = useForm<CreateUserValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: "", email: "", role: "STUDENT", password: "" },
  })

  const { users, meta, stats, isLoading, error, refetch } = useUsers({
    page,
    limit: 10,
    search: search || undefined,
    role: role || undefined,
  })
  const { pending, createUser, setStatus, resetPassword } = useUserMutations()

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const copy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      toast.success("Copied to clipboard")
    } catch {
      toast.error("Clipboard is not available")
    }
  }

  const submitCreate = form.handleSubmit(async (values) => {
    try {
      await createUser({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        role: values.role,
      })
      toast.success(`${values.name} added to the directory`)
      setCreateOpen(false)
      form.reset()
      refetch()
    } catch (err) {
      // A duplicate email is only detectable server-side — pin it to the field.
      const message = err instanceof Error ? err.message : "Could not create the user"
      if (/already exists/i.test(message)) form.setError("email", { message })
      else toast.error(message)
    }
  })

  const stats_ = [
    { label: "Total users", value: stats?.total ?? 0, hint: "all roles" },
    { label: "Active", value: stats?.active ?? 0, hint: "can sign in" },
    { label: "Suspended", value: stats?.inactive ?? 0, hint: "access blocked" },
    {
      label: "Students",
      value: stats?.byRole.STUDENT ?? 0,
      hint: `${stats?.byRole.TEACHER ?? 0} teachers · ${stats?.byRole.PARENT ?? 0} parents`,
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <div className="transition-all duration-300 lg:pl-64">
        <AdminHeader />
        <main className="space-y-6 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Users</h1>
              <p className="text-muted-foreground">Accounts, roles and credentials for the whole school</p>
            </div>
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              New user
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats_.map((stat) => (
              <Card key={stat.label}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{stat.hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search name or email…"
                className="pl-8"
                aria-label="Search users"
              />
            </div>
            <div className="flex gap-1">
              <Button
                variant={role === "" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setRole("")
                  setPage(1)
                }}
              >
                All
              </Button>
              {roles.map((entry) => (
                <Button
                  key={entry}
                  variant={role === entry ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setRole(entry)
                    setPage(1)
                  }}
                >
                  {entry.charAt(0) + entry.slice(1).toLowerCase()}
                </Button>
              ))}
            </div>
          </div>

          {error ? (
            <Card>
              <CardContent className="p-10 text-center text-sm text-muted-foreground">{error}</CardContent>
            </Card>
          ) : isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" /> Directory
                  {meta && (
                    <span className="text-sm font-normal text-muted-foreground">
                      {meta.total} account{meta.total === 1 ? "" : "s"}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {users.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No users match this filter.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead>
                        <tr className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="py-2">User</th>
                          <th className="py-2">Role</th>
                          <th className="py-2">Reference</th>
                          <th className="py-2">Status</th>
                          <th className="py-2">Last sign-in</th>
                          <th className="py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b last:border-0">
                            <td className="py-2">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                                    {initialsOf(user.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{user.name}</p>
                                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-2">
                              <Badge className={cn("capitalize", roleTone[user.role])}>
                                {user.role.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">
                              {user.admissionNo ?? user.employeeNo ?? "—"}
                              {user.className ? ` · ${user.className}` : ""}
                              {user.department ? ` · ${user.department}` : ""}
                            </td>
                            <td className="py-2">
                              <Badge variant={user.status === "ACTIVE" ? "secondary" : "outline"}>
                                {user.status.toLowerCase()}
                              </Badge>
                            </td>
                            <td className="py-2 text-xs text-muted-foreground">
                              {user.lastLoginAt
                                ? new Date(user.lastLoginAt).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "short",
                                  })
                                : "never"}
                            </td>
                            <td className="py-2 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" aria-label={`Actions for ${user.name}`}>
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    disabled={pending}
                                    onClick={async () => {
                                      try {
                                        const result = await resetPassword(user.id)
                                        setIssued(result)
                                      } catch (err) {
                                        toast.error(err instanceof Error ? err.message : "Reset failed")
                                      }
                                    }}
                                  >
                                    <Key className="mr-2 h-4 w-4" /> Reset password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={pending}
                                    onClick={async () => {
                                      const next = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
                                      try {
                                        await setStatus(user.id, next)
                                        toast.success(`${user.name} is now ${next.toLowerCase()}`)
                                        refetch()
                                      } catch (err) {
                                        toast.error(err instanceof Error ? err.message : "Update failed")
                                      }
                                    }}
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    {user.status === "ACTIVE" ? "Suspend account" : "Reactivate account"}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {meta && meta.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Page {meta.page} of {meta.totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page <= 1}
                        onClick={() => setPage((value) => Math.max(1, value - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={meta.page >= meta.totalPages}
                        onClick={() => setPage((value) => value + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      {/* New user */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add a user</DialogTitle>
            <DialogDescription>
              Creates a sign-in account. Link the student or teacher profile from its own page afterwards.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={submitCreate} className="space-y-3" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input autoComplete="name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" autoComplete="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <select
                        className="h-9 w-full rounded-md border border-input bg-transparent px-2 text-sm shadow-sm"
                        {...field}
                      >
                        {roles.map((entry) => (
                          <option key={entry} value={entry}>
                            {entry.charAt(0) + entry.slice(1).toLowerCase()}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temporary password</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Hand this to the user once — they can change it after signing in.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={pending}>
                {pending ? "Creating…" : "Create account"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Issued password */}
      <Dialog open={issued !== null} onOpenChange={(open) => !open && setIssued(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New password for {issued?.name}</DialogTitle>
            <DialogDescription>Shown once. Share it over a secure channel and ask them to change it.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/40 p-3">
            <code className="flex-1 break-all text-sm">{issued?.password}</code>
            <Button variant="outline" size="sm" onClick={() => issued && copy(issued.password)}>
              <Copy className="mr-2 h-4 w-4" /> Copy
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
