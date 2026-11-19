"use client"

import type React from "react"

import { useState } from "react"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, Users, Shield, Eye, EyeOff, Loader2, School, Sparkles, BookOpen, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"

const roleOptions: { role: UserRole; label: string; icon: React.ElementType; description: string; color: string }[] = [
  {
    role: "student",
    label: "Student",
    icon: GraduationCap,
    description: "View attendance, results & fees",
    color: "from-blue-500 to-cyan-500",
  },
  {
    role: "teacher",
    label: "Teacher",
    icon: Users,
    description: "Mark attendance & submit results",
    color: "from-emerald-500 to-teal-500",
  },
  {
    role: "admin",
    label: "Admin",
    icon: Shield,
    description: "Full system access",
    color: "from-violet-500 to-purple-500",
  },
]

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!selectedRole) {
      setError("Please select your role to continue")
      return
    }

    if (!email || !password) {
      setError("Please enter your email and password")
      return
    }

    const result = await login(email, password, selectedRole)
    if (!result.success && result.error) {
      setError(result.error)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
              <School className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">EduFlow</h1>
              <p className="text-white/70 text-sm">School Management System</p>
            </div>
          </div>

          <h2 className="text-4xl xl:text-5xl font-bold leading-tight mb-6 text-balance">
            Empowering Education Through Technology
          </h2>
          <p className="text-lg text-white/80 mb-12 max-w-lg leading-relaxed">
            A comprehensive platform connecting students, teachers, and administrators for seamless school management.
          </p>

          {/* Feature Cards */}
          <div className="space-y-4">
            <FeatureCard
              icon={Sparkles}
              title="Smart Analytics"
              description="Real-time insights into student performance and attendance"
            />
            <FeatureCard
              icon={BookOpen}
              title="Subject-wise Tracking"
              description="Detailed attendance and results for each subject"
            />
            <FeatureCard
              icon={Calendar}
              title="Seamless Communication"
              description="Instant notifications and updates for all stakeholders"
            />
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <School className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">EduFlow</h1>
              <p className="text-muted-foreground text-xs">School Management System</p>
            </div>
          </div>

          <Card className="border-0 shadow-2xl shadow-primary/5">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">Sign in to access your dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Select Your Role</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {roleOptions.map(({ role, label, icon: Icon, description, color }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300",
                          selectedRole === role
                            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-accent",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white transition-transform duration-300",
                            color,
                            selectedRole === role && "scale-110",
                          )}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <span className="font-semibold text-sm">{label}</span>
                        <span className="text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">
                          {description}
                        </span>
                        {selectedRole === role && (
                          <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <svg
                              className="h-2.5 w-2.5 text-primary-foreground"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email / Username</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    autoComplete="email"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <Alert variant="destructive" className="animate-in fade-in-0 slide-in-from-top-1">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Submit Button */}
                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Demo Credentials */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center mb-3">Demo Credentials</p>
                  <div className="grid gap-2 text-xs">
                    <DemoCredential role="Student" email="student@gmail.com" password="student123" />
                    <DemoCredential role="Teacher" email="teacher@gmail.com" password="teacher123" />
                    <DemoCredential role="Admin" email="admin" password="admin" />
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Having trouble? Contact your school administrator
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-sm text-white/70">{description}</p>
      </div>
    </div>
  )
}

function DemoCredential({ role, email, password }: { role: string; email: string; password: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
      <span className="font-medium text-foreground">{role}:</span>
      <span className="text-muted-foreground">
        {email} / {password}
      </span>
    </div>
  )
}
