"use client"

import { useMemo } from "react"
import { useMyTimetable } from "./use-timetable"
import { useDashboardSummary } from "./use-dashboard"

/**
 * A learner's subject list, assembled from the two endpoints they may read:
 * the timetable (who teaches it, how often) and their published results
 * (latest grade, running average). No new endpoint required.
 */
export interface SubjectCard {
  subjectId: string
  name: string
  code: string | null
  teacherName: string | null
  roomNo: string | null
  periodsPerWeek: number
  latestGrade: string | null
  latestPercent: number | null
  averagePercent: number | null
  resultsCount: number
  bestPercent: number | null
}

export function useMySubjects() {
  const timetable = useMyTimetable()
  const dashboard = useDashboardSummary()

  const subjects = useMemo<SubjectCard[]>(() => {
    const slots = timetable.grid?.slots ?? []
    const results = dashboard.summary?.role === "STUDENT" ? dashboard.summary.results : []

    const cards = new Map<string, SubjectCard>()

    for (const slot of slots) {
      const existing = cards.get(slot.subjectId)
      if (existing) {
        existing.periodsPerWeek += 1
        continue
      }
      cards.set(slot.subjectId, {
        subjectId: slot.subjectId,
        name: slot.subjectName,
        code: slot.subjectCode,
        teacherName: slot.teacherName,
        roomNo: slot.roomNo,
        periodsPerWeek: 1,
        latestGrade: null,
        latestPercent: null,
        averagePercent: null,
        resultsCount: 0,
        bestPercent: null,
      })
    }

    // attach results (results arrive newest-first from the API)
    const perSubject = new Map<string, { percents: number[]; grade: string | null; latest: number | null }>()
    for (const result of results) {
      const bucket = perSubject.get(result.subjectName) ?? { percents: [], grade: null, latest: null }
      if (result.percent !== null) {
        bucket.percents.push(result.percent)
        if (bucket.latest === null) bucket.latest = result.percent
        if (bucket.grade === null) bucket.grade = result.grade
      }
      perSubject.set(result.subjectName, bucket)
    }

    for (const card of cards.values()) {
      const bucket = perSubject.get(card.name)
      if (!bucket) continue
      const percents = bucket.percents
      card.latestGrade = bucket.grade
      card.latestPercent = bucket.latest
      card.resultsCount = percents.length
      card.averagePercent =
        percents.length === 0 ? null : Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
      card.bestPercent = percents.length === 0 ? null : Math.max(...percents)
    }

    return [...cards.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [timetable.grid, dashboard.summary])

  return {
    subjects,
    isLoading: timetable.isLoading || dashboard.isLoading,
    error: timetable.error ?? dashboard.error,
    refetch: () => {
      timetable.refetch()
      dashboard.refetch()
    },
  }
}
