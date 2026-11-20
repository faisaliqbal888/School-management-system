"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import { apiFetch, ApiRequestError } from "@/lib/api-client"

export type UserRole = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT"

/** Role-specific details returned by `GET /auth/me` (flattened for the UI). */
export interface StudentProfile {
  studentId: string
  admissionNo: string
  rollNo: string | null
  classId: string | null
  className: string | null
  level: number | null
  sectionId: string | null
  sectionName: string | null
  status: string
}

export interface TeacherProfile {
  teacherId: string
  employeeNo: string
  department: string
  designation: string
  status: string
  subjects: { id: string; name: string; code: string }[]
  classTeacherOf: { id: string; name: string } | null
}

export interface ParentProfile {
  parentId: string
  children: { studentId: string; name: string; admissionNo: string; className: string | null }[]
}

export interface AdminProfile {
  isAdmin: true
}

export interface SessionUser {
  id: string
  email: string
  name: string
  role: UserRole
  phone: string | null
  avatarUrl: string | null
  profile: StudentProfile | TeacherProfile | ParentProfile | AdminProfile | null

  // ── derived convenience fields (flattened from `profile`) ──
  // Components use these directly instead of branching on role.
  avatar?: string
  class?: string | null
  section?: string | null
  rollNo?: string | null
  admissionNo?: string | null
  staffNo?: string | null
  department?: string | null
  children?: ParentProfile["children"]
}

/** Flattens the role profile into the convenience fields above. */
export function flattenSessionUser(user: SessionUser): SessionUser {
  const profile = user.profile
  const flat: SessionUser = { ...user, avatar: user.avatarUrl ?? undefined }

  if (isStudentProfile(profile)) {
    flat.class = profile.level != null ? String(profile.level) : null
    flat.section = profile.sectionName
    flat.rollNo = profile.rollNo
    flat.admissionNo = profile.admissionNo
  }
  if (isTeacherProfile(profile)) {
    flat.staffNo = profile.employeeNo
    flat.department = profile.department
  }
  if (isParentProfile(profile)) {
    flat.children = profile.children
  }
  return flat
}

// ── UI conveniences ──────────────────────────────────────────
// The backend keeps role data under `profile`; components mostly want flat
// fields (user.class, user.department, …). These helpers derive them so the
// UI never has to branch on role.

export function isStudentProfile(p: SessionUser["profile"]): p is StudentProfile {
  return !!p && "studentId" in p
}
export function isTeacherProfile(p: SessionUser["profile"]): p is TeacherProfile {
  return !!p && "teacherId" in p
}
export function isParentProfile(p: SessionUser["profile"]): p is ParentProfile {
  return !!p && "parentId" in p
}

/** Avatar with a role-neutral fallback so components can use one field. */
export function userAvatar(user: SessionUser | null): string | undefined {
  return user?.avatarUrl ?? undefined
}

/** Human label for the role, e.g. "Teacher". */
export function roleLabel(role: UserRole | undefined): string {
  if (!role) return ""
  return role.charAt(0) + role.slice(1).toLowerCase()
}

export function isAdmin(role: UserRole | undefined): boolean {
  return role === "ADMIN"
}

interface AuthContextType {
  user: SessionUser | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

/** Where each role lands after signing in. */
export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
  PARENT: "/parent/dashboard",
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Restore the session on first paint. The access token lives in an httpOnly
  // cookie, so the only way to know if we are signed in is to ask the server —
  // apiFetch transparently refreshes once if the access token has expired.
  const refreshUser = useCallback(async () => {
    try {
      const data = await apiFetch<{ user: SessionUser }>("/auth/me")
      setUser(flattenSessionUser(data.user))
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const data = await apiFetch<{ user: SessionUser }>("/auth/me")
        if (!cancelled) setUser(flattenSessionUser(data.user))
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const data = await apiFetch<{ user: SessionUser }>("/auth/login", {
          method: "POST",
          body: { email, password },
          skipRefresh: true,
        })
        setUser(flattenSessionUser(data.user))
        router.push(ROLE_HOME[data.user.role] ?? "/")
        return { success: true }
      } catch (err) {
        if (err instanceof ApiRequestError) {
          return { success: false, error: err.message }
        }
        return {
          success: false,
          error: "Cannot reach the server. Is the backend running?",
        }
      }
    },
    [router],
  )

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST", skipRefresh: true })
    } catch {
      /* signing out locally is enough even if the call fails */
    }
    setUser(null)
    router.push("/login")
  }, [router])

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      login,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// ─────────────────────────────────────────────────────────────
//  route guards
// ─────────────────────────────────────────────────────────────

/**
 * Protects a page: redirects to /login when signed out, and to the role's own
 * home when signed in with the wrong role. Returns `true` when it is safe to
 * render the page.
 *
 *   const ready = useRequireRole("ADMIN")
 *   if (!ready) return <FullPageSpinner />
 */
export function useRequireRole(...allowed: UserRole[]): {
  ready: boolean
  user: SessionUser | null
} {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (allowed.length > 0 && !allowed.includes(user.role)) {
      router.replace(ROLE_HOME[user.role] ?? "/login")
    }
  }, [isLoading, user, allowed, router])

  const ready =
    !isLoading && user !== null && (allowed.length === 0 || allowed.includes(user.role))

  return { ready, user }
}
