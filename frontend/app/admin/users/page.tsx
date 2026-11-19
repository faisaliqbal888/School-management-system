"use client"

import { useAuth, useRequireRole } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Loader2,
  UserPlus,
  Search,
  Copy,
  CheckCircle2,
  Users,
  GraduationCap,
  MoreVertical,
  Edit,
  Trash2,
  Key,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const existingUsers = [
  {
    id: "1",
    name: "Alex Thompson",
    email: "student@gmail.com",
    role: "student",
    class: "10-A",
    status: "active",
    createdAt: "Nov 15, 2024",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "teacher@gmail.com",
    role: "teacher",
    department: "Mathematics",
    status: "active",
    createdAt: "Sep 1, 2024",
  },
  {
    id: "3",
    name: "Emma Wilson",
    email: "emma.w@school.edu",
    role: "student",
    class: "10-A",
    status: "active",
    createdAt: "Nov 10, 2024",
  },
  {
    id: "4",
    name: "John Smith",
    email: "john.s@school.edu",
    role: "teacher",
    department: "Physics",
    status: "active",
    createdAt: "Aug 15, 2024",
  },
  {
    id: "5",
    name: "Michael Lee",
    email: "michael.l@school.edu",
    role: "student",
    class: "9-B",
    status: "inactive",
    createdAt: "Oct 20, 2024",
  },
]

export default function AdminUsersPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student",
    class: "",
    department: "",
  })
  const [generatedCredentials, setGeneratedCredentials] = useState<{ email: string; password: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const { ready } = useRequireRole("ADMIN")

  const handleCreateUser = () => {
    const tempPassword = `Temp${Math.random().toString(36).slice(-8)}!`
    setGeneratedCredentials({
      email: newUser.email,
      password: tempPassword,
    })
  }

  const copyCredentials = () => {
    if (generatedCredentials) {
      navigator.clipboard.writeText(`Email: ${generatedCredentials.email}\nPassword: ${generatedCredentials.password}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const filteredUsers = existingUsers.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === "all" || u.role === roleFilter
    return matchesSearch && matchesRole
  })

  if (!ready) return <FullPageLoader />

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-violet-50/20">
      <AdminSidebar />
      <div className="lg:pl-64 transition-all duration-300">
        <AdminHeader />
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">👤 User & Credential Management</h1>
              <p className="text-violet-100 mt-1">Create and manage user credentials for students and teachers</p>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-500 to-purple-600">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Create credentials for a new student or teacher. A temporary password will be generated.
                  </DialogDescription>
                </DialogHeader>

                {!generatedCredentials ? (
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input
                        placeholder="Enter full name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {newUser.role === "student" && (
                      <div className="space-y-2">
                        <Label>Class</Label>
                        <Select value={newUser.class} onValueChange={(v) => setNewUser({ ...newUser, class: v })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="9-A">Class 9-A</SelectItem>
                            <SelectItem value="9-B">Class 9-B</SelectItem>
                            <SelectItem value="10-A">Class 10-A</SelectItem>
                            <SelectItem value="10-B">Class 10-B</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {newUser.role === "teacher" && (
                      <div className="space-y-2">
                        <Label>Department</Label>
                        <Select
                          value={newUser.department}
                          onValueChange={(v) => setNewUser({ ...newUser, department: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Mathematics">Mathematics</SelectItem>
                            <SelectItem value="Physics">Physics</SelectItem>
                            <SelectItem value="Chemistry">Chemistry</SelectItem>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Computer Science">Computer Science</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button className="w-full" onClick={handleCreateUser}>
                      Generate Credentials
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          User Created Successfully
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email:</span>
                          <span className="font-mono">{generatedCredentials.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Temporary Password:</span>
                          <span className="font-mono">{generatedCredentials.password}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      The user will be required to change their password on first login.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 bg-transparent" onClick={copyCredentials}>
                        {copied ? <CheckCircle2 className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                        {copied ? "Copied!" : "Copy Credentials"}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setGeneratedCredentials(null)
                          setNewUser({ name: "", email: "", role: "student", class: "", department: "" })
                          setCreateDialogOpen(false)
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{existingUsers.length}</p>
                </div>
                <Users className="h-8 w-8 text-violet-500" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{existingUsers.filter((u) => u.role === "student").length}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-blue-500" />
              </CardContent>
            </Card>
            <Card className="border-0 shadow-md">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Teachers</p>
                  <p className="text-2xl font-bold">{existingUsers.filter((u) => u.role === "teacher").length}</p>
                </div>
                <Users className="h-8 w-8 text-emerald-500" />
              </CardContent>
            </Card>
          </div>

          {/* User List */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <CardTitle>All Users</CardTitle>
                <div className="flex gap-3">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="student">Students</SelectItem>
                      <SelectItem value="teacher">Teachers</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-4 rounded-xl border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src="/placeholder.svg" />
                        <AvatarFallback
                          className={
                            u.role === "student" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600"
                          }
                        >
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <Badge variant={u.role === "student" ? "secondary" : "default"} className="mb-1">
                          {u.role}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {u.role === "student" ? `Class ${u.class}` : u.department}
                        </p>
                      </div>
                      <Badge variant={u.status === "active" ? "outline" : "secondary"}>{u.status}</Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Key className="h-4 w-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" /> Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
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
