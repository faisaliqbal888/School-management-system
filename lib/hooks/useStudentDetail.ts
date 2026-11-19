"use client"

import { useEffect, useState } from 'react'

export function useStudentDetail(studentId: number | string | null) {
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    if (!studentId) return
    
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/admin/students/${studentId}`)
        if (!res.ok) throw new Error('Failed to fetch student')
        const data = await res.json()
        if (mounted) setStudent(data)
      } catch (e) {
        if (mounted) setError(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    load()
    return () => { mounted = false }
  }, [studentId])

  return { student, loading, error }
}
