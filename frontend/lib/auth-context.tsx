"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

export type UserRole = "admin" | "teacher" | "student"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  // Student specific
  admissionNo?: string
  class?: string
  section?: string
  rollNo?: string
  // Teacher specific
  staffNo?: string
  department?: string
  subjects?: string[]
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string, selectedRole: UserRole) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users database for demo
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: "admin",
    user: {
      id: "admin-001",
      email: "admin@eduflow.com",
      name: "Admin User",
      role: "admin",
      avatar: "/admin-portrait.png",
    },
  },
  "teacher@gmail.com": {
    password: "teacher123",
    user: {
      id: "teacher-001",
      email: "teacher@gmail.com",
      name: "Sarah Johnson",
      role: "teacher",
      staffNo: "STF-2025-001",
      department: "Mathematics",
      subjects: ["Mathematics", "Physics"],
      avatar: "/female-teacher-portrait.png",
    },
  },
  "student@gmail.com": {
    password: "student123",
    user: {
      id: "student-001",
      email: "student@gmail.com",
      name: "Alex Thompson",
      role: "student",
      admissionNo: "ADM2025-001",
      class: "10",
      section: "A",
      rollNo: "15",
      avatar: "/diverse-student-portraits.png",
    },
  },
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem("eduflow_user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem("eduflow_user")
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (
    email: string,
    password: string,
    selectedRole: UserRole,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    const userRecord = MOCK_USERS[email]

    if (!userRecord) {
      setIsLoading(false)
      return { success: false, error: "Invalid credentials. User not found." }
    }

    if (userRecord.password !== password) {
      setIsLoading(false)
      return { success: false, error: "Invalid credentials. Wrong password." }
    }

    if (userRecord.user.role !== selectedRole) {
      setIsLoading(false)
      return { success: false, error: `Your account is not registered as ${selectedRole}. Contact admin.` }
    }

    // Success
    setUser(userRecord.user)
    localStorage.setItem("eduflow_user", JSON.stringify(userRecord.user))
    setIsLoading(false)

    // Redirect based on role
    const redirectMap: Record<UserRole, string> = {
      admin: "/admin/dashboard",
      teacher: "/teacher/dashboard",
      student: "/student/dashboard",
    }

    router.push(redirectMap[selectedRole])
    return { success: true }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("eduflow_user")
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
