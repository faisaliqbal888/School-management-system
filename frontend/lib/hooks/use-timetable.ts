"use client"

import { useCallback, useMemo } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiMutation, useApiQuery } from "./use-api-query"

// ─────────────────────────────────────────────────────────────
//  types — mirror backend/src/services/timetable.service.ts
// ─────────────────────────────────────────────────────────────

export type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY"

export interface SlotRow {
  id: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  roomNo: string | null
  classId: string
  className: string
  sectionId: string | null
  sectionName: string | null
  subjectId: string
  subjectName: string
  subjectCode: string | null
  teacherId: string | null
  teacherName: string | null
  isCurrent: boolean
}

export interface TimetableGrid {
  scope: {
    kind: "section" | "teacher"
    sectionId?: string
    sectionName?: string | null
    className?: string
    teacherId?: string
    teacherName?: string
  }
  days: DayOfWeek[]
  periods: { startTime: string; endTime: string }[]
  slots: SlotRow[]
}

export interface TimetableOptions {
  classes: { id: string; name: string; level: number; sections: { id: string; name: string }[] }[]
  subjects: { id: string; name: string; code: string | null; classId: string }[]
  teachers: { id: string; name: string; department: string | null }[]
}

export interface TodayClasses {
  day: DayOfWeek
  classes: SlotRow[]
}

export interface CreateSlotInput {
  classId: string
  sectionId?: string | null
  subjectId: string
  teacherId?: string | null
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  roomNo?: string | null
}

export type UpdateSlotInput = Partial<CreateSlotInput> & { id: string }

const DAY_LABEL: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
}

export const dayLabel = (day: string) => DAY_LABEL[day] ?? day

/** 24h "08:45" → "8:45 AM" for display. */
export function prettyTime(time: string) {
  const [h, m] = time.split(":").map(Number)
  const hour = h ?? 0
  const suffix = hour >= 12 ? "PM" : "AM"
  const display = hour % 12 === 0 ? 12 : hour % 12
  return `${display}:${String(m ?? 0).padStart(2, "0")} ${suffix}`
}

// ─────────────────────────────────────────────────────────────
//  reads
// ─────────────────────────────────────────────────────────────

export function useSectionTimetable(sectionId: string | undefined) {
  const key = sectionId ? `/timetable/section/${sectionId}` : null
  const query = useApiQuery<TimetableGrid>(key)
  return {
    ...query,
    grid: query.data ?? undefined,
    error: query.error,
  }
}

export function useTeacherTimetable(teacherId?: string) {
  const key = teacherId ? `/timetable/teacher/${teacherId}` : "/timetable/teacher"
  const query = useApiQuery<TimetableGrid>(key)
  return { ...query, grid: query.data ?? undefined }
}

/** The signed-in learner's / teacher's own schedule. */
export function useMyTimetable() {
  const query = useApiQuery<TimetableGrid>("/timetable/me")
  return { ...query, grid: query.data ?? undefined }
}

export function useTimetableOptions(enabled = true) {
  const query = useApiQuery<TimetableOptions>("/timetable/options", { enabled })
  return { ...query, options: query.data ?? undefined }
}

export function useTodayClasses() {
  const query = useApiQuery<TodayClasses>("/timetable/today", { refetchInterval: 120 })
  return { ...query, today: query.data ?? undefined }
}

/** Flat slot list → `cell(day, startTime)` lookup for the grid. */
export function useGridModel(grid: TimetableGrid | undefined) {
  return useMemo(() => {
    const lookup = new Map<string, SlotRow>()
    for (const slot of grid?.slots ?? []) lookup.set(`${slot.dayOfWeek}|${slot.startTime}`, slot)

    return {
      days: grid?.days ?? [],
      periods: grid?.periods ?? [],
      slots: grid?.slots ?? [],
      cell: (day: DayOfWeek, startTime: string) => lookup.get(`${day}|${startTime}`),
    }
  }, [grid])
}

// ─────────────────────────────────────────────────────────────
//  writes (ADMIN)
// ─────────────────────────────────────────────────────────────

export function useCreateSlot() {
  return useApiMutation<{ id: string }, CreateSlotInput>((body) =>
    apiFetch<{ id: string }>("/timetable/slots", { method: "POST", body }),
  )
}

export function useUpdateSlot() {
  return useApiMutation<{ id: string }, UpdateSlotInput>(({ id, ...body }) =>
    apiFetch<{ id: string }>(`/timetable/slots/${id}`, { method: "PATCH", body }),
  )
}

export function useDeleteSlot() {
  return useApiMutation<void, string>((id) => apiFetch<void>(`/timetable/slots/${id}`, { method: "DELETE" }))
}

/** Convenience: delete + refresh both the grid and any derived widgets. */
export function useSlotActions(onChanged?: () => void) {
  const create = useCreateSlot()
  const update = useUpdateSlot()
  const remove = useDeleteSlot()

  const createSlot = useCallback(
    async (input: CreateSlotInput) => {
      const result = await create.mutate(input)
      onChanged?.()
      return result
    },
    [create, onChanged],
  )

  const updateSlot = useCallback(
    async (input: UpdateSlotInput) => {
      const result = await update.mutate(input)
      onChanged?.()
      return result
    },
    [update, onChanged],
  )

  const deleteSlot = useCallback(
    async (id: string) => {
      await remove.mutate(id)
      onChanged?.()
    },
    [remove, onChanged],
  )

  return {
    createSlot,
    updateSlot,
    deleteSlot,
    isPending: create.isPending || update.isPending || remove.isPending,
  }
}
