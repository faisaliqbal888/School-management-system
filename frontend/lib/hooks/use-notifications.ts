"use client"

import { useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiMutation, useApiQuery, type PaginationMeta } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/notifications.service.ts
// ─────────────────────────────────────────────────────────────

export type NotificationAudience = "ALL" | "ADMINS" | "TEACHERS" | "STUDENTS" | "PARENTS" | "CLASS"
export type NotificationChannel = "IN_APP" | "EMAIL" | "SMS"

export interface NotificationRow {
  id: string
  title: string
  body: string
  audience: NotificationAudience
  channel: NotificationChannel
  classId: string | null
  className: string | null
  authorId: string | null
  authorName: string | null
  sentAt: string | null
  createdAt: string
  isRead: boolean
  readAt: string | null
}

export interface ComposerOptions {
  audiences: NotificationAudience[]
  classes: { id: string; name: string; students: number }[]
}

export interface DeliveryStats {
  total: number
  activeUsers: number
  recent: { id: string; title: string; audience: NotificationAudience; readCount: number; sentAt: string }[]
}

export interface NotificationFilters {
  page?: number
  limit?: number
  search?: string
  audience?: NotificationAudience | "ALL_AUDIENCES"
  unreadOnly?: boolean
}

export interface CreateNotificationInput {
  title: string
  body: string
  audience: NotificationAudience
  channel?: NotificationChannel
  classId?: string | null
}

export const AUDIENCE_LABEL: Record<NotificationAudience, string> = {
  ALL: "Everyone",
  ADMINS: "Administrators",
  TEACHERS: "Teachers",
  STUDENTS: "Students",
  PARENTS: "Parents",
  CLASS: "Single class",
}

export const audienceTone: Record<NotificationAudience, string> = {
  ALL: "bg-slate-100 text-slate-700",
  ADMINS: "bg-indigo-100 text-indigo-700",
  TEACHERS: "bg-emerald-100 text-emerald-700",
  STUDENTS: "bg-blue-100 text-blue-700",
  PARENTS: "bg-rose-100 text-rose-700",
  CLASS: "bg-amber-100 text-amber-700",
}

/** "2 hours ago" / "yesterday" / "12 Nov 2026". */
export function timeAgo(iso: string | null) {
  if (!iso) return "—"
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return "—"

  const diff = Date.now() - then
  const minutes = Math.round(diff / 60000)
  if (minutes < 1) return "just now"
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`

  const days = Math.round(hours / 24)
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`

  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

// ─────────────────────────────────────────────────────────────
//  inbox
// ─────────────────────────────────────────────────────────────

export function useNotifications(filters: NotificationFilters = {}) {
  const key = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(filters.page ?? 1))
    params.set("limit", String(filters.limit ?? 20))
    if (filters.search) params.set("search", filters.search)
    if (filters.audience && filters.audience !== "ALL_AUDIENCES") params.set("audience", filters.audience)
    if (filters.unreadOnly) params.set("unreadOnly", "true")
    return `/notifications?${params.toString()}`
  }, [filters.page, filters.limit, filters.search, filters.audience, filters.unreadOnly])

  const query = useApiQuery<NotificationRow[]>(key)

  return {
    notifications: query.data ?? [],
    meta: query.meta as PaginationMeta | null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useUnreadCount() {
  const query = useApiQuery<{ total: number; unread: number }>("/notifications/unread-count", {
    refetchInterval: 60,
  })
  return { ...query, unread: query.data?.unread ?? 0, total: query.data?.total ?? 0 }
}

export function useComposerOptions(enabled = true) {
  const query = useApiQuery<ComposerOptions>("/notifications/options", { enabled })
  return { ...query, options: query.data ?? undefined }
}

export function useDeliveryStats(enabled = true) {
  const query = useApiQuery<DeliveryStats>("/notifications/stats", { enabled })
  return { ...query, stats: query.data ?? undefined }
}

// ─────────────────────────────────────────────────────────────
//  writes
// ─────────────────────────────────────────────────────────────

export interface DeliverySummary {
  attempted: number
  sent: number
  failed: number
  channels: NotificationChannel[]
}

export interface CreateNotificationResult {
  id: string
  delivery?: DeliverySummary
}

export function useCreateNotification() {
  return useApiMutation<CreateNotificationResult, CreateNotificationInput>((body) =>
    apiFetch<CreateNotificationResult>("/notifications", { method: "POST", body }),
  )
}

export function useDeleteNotification() {
  return useApiMutation<void, string>((id) =>
    apiFetch<void>(`/notifications/${id}`, { method: "DELETE" }),
  )
}

/** Marks one notice read/unread and lets the caller refresh lists. */
export function useToggleRead() {
  return useApiMutation<NotificationRow, { id: string; read: boolean }>(({ id, read }) =>
    apiFetch<NotificationRow>(`/notifications/${id}`, { method: "PATCH", body: { read } }),
  )
}

export function useMarkAllRead() {
  return useApiMutation<{ marked: number }, void>(() =>
    apiFetch<{ marked: number }>("/notifications/read-all", { method: "POST" }),
  )
}

/** Combines the mutations a notice list needs. */
export function useInboxActions(onChanged: () => void) {
  const toggle = useToggleRead()
  const markAll = useMarkAllRead()
  const remove = useDeleteNotification()

  const setRead = useCallback(
    async (id: string, read: boolean) => {
      await toggle.mutate({ id, read })
      onChanged()
    },
    [toggle, onChanged],
  )

  const markEverythingRead = useCallback(async () => {
    const result = await markAll.mutate()
    onChanged()
    return result
  }, [markAll, onChanged])

  const deleteNotice = useCallback(
    async (id: string) => {
      await remove.mutate(id)
      onChanged()
    },
    [remove, onChanged],
  )

  return {
    setRead,
    markEverythingRead,
    deleteNotice,
    isPending: toggle.isPending || markAll.isPending || remove.isPending,
  }
}
