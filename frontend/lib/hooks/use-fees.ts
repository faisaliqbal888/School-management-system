"use client"

import { useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiQuery, type PaginationMeta } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/fees.service.ts
// ─────────────────────────────────────────────────────────────

export type InvoiceStatus = "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "CANCELLED" | "WAIVED"
export type PaymentMethod = "CASH" | "BANK_TRANSFER" | "CARD" | "ONLINE" | "CHEQUE"
export type FeeFrequency = "MONTHLY" | "QUARTERLY" | "ANNUAL" | "ONE_TIME"

export interface InvoiceRow {
  id: string
  invoiceNo: string
  title: string
  period: string | null
  studentId: string
  studentName: string
  admissionNo: string
  className: string
  sectionName: string | null
  amount: number
  discount: number
  fine: number
  totalAmount: number
  paidAmount: number
  balance: number
  dueDate: string
  status: InvoiceStatus
  paymentsCount: number
}

export interface InvoicePayment {
  id: string
  receiptNo: string
  amount: number
  method: PaymentMethod
  paidAt: string
  reference: string | null
  notes: string | null
}

export interface InvoiceDetail extends InvoiceRow {
  notes: string | null
  createdAt: string
  payments: InvoicePayment[]
}

export interface FeesSummary {
  billed: number
  paid: number
  outstanding: number
  collectionRate: number | null
  invoices: {
    total: number
    pending: number
    partial: number
    paid: number
    overdue: number
    waived: number
    cancelled: number
  }
  collectedThisMonth: number
  currency: "PKR"
}

export interface FeeStructureRow {
  id: string
  name: string
  classId: string
  className: string
  subjectName: string | null
  amount: number
  frequency: FeeFrequency
  dueDay: number
  isActive: boolean
  invoiceCount: number
}

export interface PaymentRow {
  id: string
  receiptNo: string
  amount: number
  method: PaymentMethod
  paidAt: string
  reference: string | null
  invoiceId: string
  invoiceNo: string
  invoiceTitle: string
  studentId: string
  studentName: string
  admissionNo: string
}

export interface InvoiceFilters {
  page?: number
  limit?: number
  search?: string
  status?: InvoiceStatus
  studentId?: string
  classId?: string
  period?: string
}

export interface InvoiceTotals {
  billed: number
  paid: number
  outstanding: number
}

export interface CreateInvoicePayload {
  studentId: string
  title: string
  amount: number
  discount?: number
  fine?: number
  dueDate: string
  period?: string | null
  notes?: string | null
  feeStructureId?: string | null
}

export interface RecordPaymentPayload {
  invoiceId: string
  amount: number
  method?: PaymentMethod
  reference?: string | null
  notes?: string | null
  paidAt?: string
}

function toQueryString(filters: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "" || value === "all") continue
    params.set(key, String(value))
  }
  return params.toString()
}

// ─────────────────────────────────────────────────────────────
//  hooks
// ─────────────────────────────────────────────────────────────

export function useFeesSummary(enabled = true) {
  const result = useApiQuery<FeesSummary>("/fees/summary", { enabled })
  return {
    summary: result.data ?? undefined,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useInvoices(filters: InvoiceFilters = {}) {
  const query = useMemo(() => toQueryString(filters as Record<string, unknown>), [filters])
  const key = `/fees/invoices${query ? `?${query}` : ""}`

  // the list endpoint puts totals alongside pagination in `meta`
  const result = useApiQuery<InvoiceRow[]>(key)
  const rawMeta = result.meta as (PaginationMeta & Partial<InvoiceTotals>) | null

  return {
    invoices: result.data ?? [],
    meta: rawMeta,
    totals: {
      billed: rawMeta?.billed ?? 0,
      paid: rawMeta?.paid ?? 0,
      outstanding: rawMeta?.outstanding ?? 0,
    } as InvoiceTotals,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useInvoice(id: string | null) {
  const result = useApiQuery<InvoiceDetail>(id ? `/fees/invoices/${id}` : null)
  return {
    invoice: result.data,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useFeeStructures(enabled = true) {
  const result = useApiQuery<FeeStructureRow[]>("/fees/structures", { enabled })
  return {
    structures: result.data ?? [],
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function usePayments(filters: { page?: number; limit?: number; search?: string; invoiceId?: string } = {}) {
  const query = useMemo(() => toQueryString(filters as Record<string, unknown>), [filters])
  const result = useApiQuery<PaymentRow[]>(`/fees/payments${query ? `?${query}` : ""}`)
  return {
    payments: result.data ?? [],
    meta: result.meta as PaginationMeta | null,
    isLoading: result.isLoading,
    error: result.error,
    refetch: result.refetch,
  }
}

export function useCreateInvoice() {
  return useCallback(
    (payload: CreateInvoicePayload) =>
      apiFetch<{ id: string; invoiceNo: string; totalAmount: number }>("/fees/invoices", {
        method: "POST",
        body: payload,
      }),
    [],
  )
}

export function useRecordPayment() {
  return useCallback(
    (payload: RecordPaymentPayload) =>
      apiFetch<{
        id: string
        receiptNo: string
        amount: number
        paidAmount: number
        balance: number
        status: InvoiceStatus
      }>("/fees/payments", { method: "POST", body: payload }),
    [],
  )
}

export function useWaiveInvoice() {
  return useCallback(
    (id: string, reason: string) =>
      apiFetch<{ id: string; status: InvoiceStatus }>(`/fees/invoices/${id}/waive`, {
        method: "PATCH",
        body: { reason },
      }),
    [],
  )
}

export function useCreateFeeStructure() {
  return useCallback(
    (payload: {
      name: string
      classId: string
      amount: number
      frequency?: FeeFrequency
      dueDay?: number
      subjectId?: string | null
    }) => apiFetch<{ id: string; name: string; amount: number }>("/fees/structures", { method: "POST", body: payload }),
    [],
  )
}

export function useGenerateInvoices() {
  return useCallback(
    (payload: { feeStructureId: string; period: string }) =>
      apiFetch<{ created: number; skipped: number; period: string }>("/fees/invoices/generate", {
        method: "POST",
        body: payload,
      }),
    [],
  )
}

/** Current period as "YYYY-MM". */
export function currentPeriod(): string {
  return new Date().toISOString().slice(0, 7)
}
