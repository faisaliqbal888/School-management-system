"use client"

import { SCHOOL } from "@/lib/school"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  GraduationCap,
  Users,
  Shield,
  Eye,
  EyeOff,
  Loader2,
  School,
  Sparkles,
  BookOpen,
  Calendar,
  UserRound,
} from "lucide-react"

/** Seeded demo accounts — one click fills the form. */
const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@ravischool.edu.pk", icon: Shield },
  { role: "Teacher", email: "ahmed.1@ravischool.edu.pk", icon: Users },
  { role: "Student", email: "student@ravischool.edu.pk", icon: GraduationCap },
  { role: "Parent", email: "parent@ravischool.edu.pk", icon: UserRound },
] as const

const DEMO_PASSWORD = "Password123"

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter your email and password")
      return
    }

    const result = await login(email, password)
    if (!result.success && result.error) {
      setError(result.error)
    }
  }

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword(DEMO_PASSWORD)
    setError("")
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
              <School className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{SCHOOL.name}</h1>
              <p className="text-white/70 text-sm">{SCHOOL.tagline}</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold leading-tight mb-4">
            Everything your school needs, in one place.
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Attendance, results, fees and communication — for administrators, teachers, students
            and parents.
          </p>

          <div className="space-y-3">
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
              <h1 className="text-2xl font-bold tracking-tight">{SCHOOL.name}</h1>
              <p className="text-muted-foreground text-xs">{SCHOOL.tagline}</p>
            </div>
          </div>

          <Card className="border-0 shadow-2xl shadow-primary/5">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
              <CardDescription className="text-center">
                Sign in with the account your school provided
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@school.edu.pk"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    autoComplete="username"
                    autoFocus
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
                      aria-label={showPassword ? "Hide password" : "Show password"}
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
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Demo Accounts */}
                <div className="pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Demo accounts · password <span className="font-mono">{DEMO_PASSWORD}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {DEMO_ACCOUNTS.map(({ role, email: demoEmail, icon: Icon }) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => fillDemo(demoEmail)}
                        className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/40 hover:bg-muted hover:border-primary/40 transition-colors text-left"
                      >
                        <Icon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-xs font-medium">{role}</span>
                      </button>
                    ))}
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
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
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
