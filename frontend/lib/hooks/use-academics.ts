"use client"

import { useCallback } from "react"
import { apiFetch } from "@/lib/api-client"
import { useApiQuery, useApiMutation } from "./use-api-query"

/**
 * Academic structure: years → classes → sections → subjects.
 *
 * Writes are ADMIN-only on the server; these hooks simply surface the errors.
 */

export interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isCurrent: boolean
}

export interface ClassRow {
  id: string
  name: string
  level: number
  capacity: number
  academicYearId: string
  classTeacherId: string | null
  academicYear?: { id: string; name: string }
  _count?: { sections: number; students: number }
}

export interface SectionRow {
  id: string
  classId: string
  name: string
  roomNo: string | null
  capacity: number
}

export interface SubjectRow {
  id: string
  name: string
  code: string
  classId: string
  isElective: boolean
  creditHours: number
  class?: { id: string; name: string }
}

export function useAcademicYears() {
  const query = useApiQuery<AcademicYear[]>("/academic-years")
  return { years: query.data ?? [], isLoading: query.isLoading, error: query.error, refetch: query.refetch }
}

export function useClasses(academicYearId?: string) {
  const params = new URLSearchParams({ limit: "100" })
  if (academicYearId) params.set("academicYearId", academicYearId)
  const query = useApiQuery<ClassRow[]>(`/classes?${params.toString()}`)
  return {
    classes: query.data ?? [],
    meta: query.meta,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useSections(classId: string | null) {
  const query = useApiQuery<SectionRow[]>(classId ? `/classes/${classId}/sections` : null)
  return {
    sections: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useSubjects(classId?: string, search?: string) {
  const params = new URLSearchParams({ limit: "100" })
  if (classId) params.set("classId", classId)
  if (search) params.set("search", search)
  const query = useApiQuery<SubjectRow[]>(`/subjects?${params.toString()}`)
  return {
    subjects: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  }
}

type Id = string

export interface AcademicMutations {
  saveYear: (body: Partial<AcademicYear> & { name?: string }, id?: Id) => Promise<unknown>
  deleteYear: (id: Id) => Promise<unknown>
  saveClass: (body: Partial<ClassRow>, id?: Id) => Promise<unknown>
  deleteClass: (id: Id) => Promise<unknown>
  saveSection: (body: Partial<SectionRow> & { classId?: string }, id?: Id) => Promise<unknown>
  deleteSection: (id: Id) => Promise<unknown>
  saveSubject: (body: Partial<SubjectRow>, id?: Id) => Promise<unknown>
  deleteSubject: (id: Id) => Promise<unknown>
}

export function useAcademicMutations(): AcademicMutations & {
  isPending: boolean
  error: string | null
} {
  const write = useCallback(
    <T,>(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) =>
      apiFetch<T>(path, { method, body }),
    [],
  )

  const saveYear = useCallback(
    (body: Partial<AcademicYear> & { name?: string }, id?: Id) =>
      write(`/academic-years${id ? `/${id}` : ""}`, id ? "PATCH" : "POST", body),
    [write],
  )
  const deleteYear = useCallback((id: Id) => write(`/academic-years/${id}`, "DELETE"), [write])

  const saveClass = useCallback(
    (body: Partial<ClassRow>, id?: Id) => write(`/classes${id ? `/${id}` : ""}`, id ? "PATCH" : "POST", body),
    [write],
  )
  const deleteClass = useCallback((id: Id) => write(`/classes/${id}`, "DELETE"), [write])

  const saveSection = useCallback(
    (body: Partial<SectionRow> & { classId?: string }, id?: Id) =>
      write(`/sections${id ? `/${id}` : ""}`, id ? "PATCH" : "POST", body),
    [write],
  )
  const deleteSection = useCallback((id: Id) => write(`/sections/${id}`, "DELETE"), [write])

  const saveSubject = useCallback(
    (body: Partial<SubjectRow>, id?: Id) => write(`/subjects${id ? `/${id}` : ""}`, id ? "PATCH" : "POST", body),
    [write],
  )
  const deleteSubject = useCallback((id: Id) => write(`/subjects/${id}`, "DELETE"), [write])

  // A single mutation instance gives the page one pending flag for every form.
  const mutation = useApiMutation<unknown, () => Promise<unknown>>((fn) => fn())

  return {
    saveYear,
    deleteYear,
    saveClass,
    deleteClass,
    saveSection,
    deleteSection,
    saveSubject,
    deleteSubject,
    isPending: mutation.isPending,
    error: mutation.error,
  }
}
