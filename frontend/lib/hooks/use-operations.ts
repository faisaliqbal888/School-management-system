"use client"

import { useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiMutation, useApiQuery } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/operations.service.ts
// ─────────────────────────────────────────────────────────────

export interface LibraryOverview {
  titles: number
  copies: number
  availableCopies: number
  onLoan: number
  overdue: number
  categories: { name: string; titles: number; copies: number }[]
}

export interface BookRow {
  id: string
  title: string
  author: string
  isbn: string | null
  category: string
  publisher: string | null
  totalCopies: number
  availableCopies: number
  shelfNo: string | null
  status: string
}

export interface BookIssueRow {
  id: string
  bookTitle: string
  bookAuthor: string
  studentName: string
  admissionNo: string
  issuedAt: string
  dueDate: string
  returnedAt: string | null
  status: string
  fine: number
}

export interface TransportOverview {
  routes: {
    id: string
    name: string
    startPoint: string
    endPoint: string
    distanceKm: number
    monthlyFee: number
    isActive: boolean
    riders: number
    vehicle: {
      id: string
      registrationNo: string
      model: string
      capacity: number
      driverName: string
      driverPhone: string
      status: string
    } | null
  }[]
  vehicles: {
    id: string
    registrationNo: string
    model: string
    capacity: number
    driverName: string
    status: string
  }[]
  riders: number
  seats: number
}

export interface HostelOverview {
  beds: number
  occupied: number
  occupancyRate: number | null
  activeAllocations: number
  monthlyRevenue: number
  rooms: {
    id: string
    block: string
    roomNo: string
    type: string
    capacity: number
    occupied: number
    monthlyFee: number
    status: string
    residents: {
      allocationId: string
      studentId: string
      name: string
      admissionNo: string
      className: string | null
      allocatedAt: string
    }[]
  }[]
}

export interface InventoryItemRow {
  id: string
  name: string
  code: string
  category: string
  quantity: number
  minQuantity: number
  unitPrice: number
  value: number
  location: string | null
  supplier: string | null
  condition: string
  purchasedAt: string | null
  lowStock: boolean
}

export interface InventoryOverview {
  items: InventoryItemRow[]
  totalValue: number
  lowStock: number
  categories: { name: string; items: number; quantity: number; value: number }[]
}

export interface RouteRider {
  id: string
  stopName: string | null
  studentId: string
  studentName: string
  admissionNo: string
  className: string | null
}

// ─────────────────────────────────────────────────────────────
//  reads
// ─────────────────────────────────────────────────────────────

export function useLibraryOverview() {
  const query = useApiQuery<LibraryOverview>("/library/overview")
  return { overview: query.data ?? undefined, isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useBooks(filters: { search?: string; category?: string; page?: number; limit?: number } = {}) {
  const key = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(filters.page ?? 1))
    params.set("limit", String(filters.limit ?? 20))
    if (filters.search) params.set("search", filters.search)
    if (filters.category) params.set("category", filters.category)
    return `/library/books?${params.toString()}`
  }, [filters.search, filters.category, filters.page, filters.limit])

  const query = useApiQuery<BookRow[]>(key)
  return {
    books: query.data ?? [],
    meta: query.meta,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useBookIssues(filters: { status?: string; search?: string; page?: number; limit?: number } = {}) {
  const key = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(filters.page ?? 1))
    params.set("limit", String(filters.limit ?? 20))
    if (filters.status) params.set("status", filters.status)
    if (filters.search) params.set("search", filters.search)
    return `/library/issues?${params.toString()}`
  }, [filters.status, filters.search, filters.page, filters.limit])

  const query = useApiQuery<BookIssueRow[]>(key)
  return {
    issues: query.data ?? [],
    meta: query.meta,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useReturnBook(onChanged?: () => void) {
  return useApiMutation<{ returned: boolean }, { id: string; fine?: number }>(async ({ id, fine }) => {
    const result = await apiFetch<{ returned: boolean }>(`/library/issues/${id}/return`, {
      method: "PATCH",
      body: { fine },
    })
    onChanged?.()
    return result
  })
}

export function useTransportOverview() {
  const query = useApiQuery<TransportOverview>("/transport/overview")
  return { overview: query.data ?? undefined, isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useRouteRiders(routeId: string | null) {
  const query = useApiQuery<RouteRider[]>(routeId ? `/transport/routes/${routeId}/riders` : null)
  return { riders: query.data ?? [], isLoading: query.isLoading, error: query.error }
}

export function useHostelOverview() {
  const query = useApiQuery<HostelOverview>("/hostel/overview")
  return { overview: query.data ?? undefined, isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useInventoryOverview() {
  const query = useApiQuery<InventoryOverview>("/inventory/overview")
  return { overview: query.data ?? undefined, isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

// ─────────────────────────────────────────────────────────────
//  HR / payroll
// ─────────────────────────────────────────────────────────────

export interface PayrollRow {
  id: string
  period: string
  staffName: string
  employeeNo: string | null
  staffType: "Teacher" | "Staff"
  department: string | null
  baseSalary: number
  allowances: number
  deductions: number
  netPay: number
  status: string
  paidAt: string | null
}

export interface PayrollOverview {
  periods: string[]
  period: string | null
  rows: PayrollRow[]
  totals: { net: number; paid: number; draft: number; headcount: number }
  headcount: { staff: number; teachers: number }
  pendingLeaves: number
}

export interface LeaveRow {
  id: string
  name: string
  fromDate: string
  toDate: string
  reason: string
  status: string
}

export function usePayroll(period?: string) {
  const key = period ? `/hr/payroll?period=${encodeURIComponent(period)}` : "/hr/payroll"
  const query = useApiQuery<PayrollOverview>(key)
  return {
    payroll: query.data ?? undefined,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useLeaveRequests() {
  const query = useApiQuery<LeaveRow[]>("/hr/leaves")
  return { leaves: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export const money = (value: number) =>
  value >= 1_000_000
    ? `${(value / 1_000_000).toFixed(2)}M`
    : value >= 10_000
      ? `${Math.round(value / 1000)}K`
      : value.toLocaleString("en-GB")
