"use client"

import { useEffect, useState } from 'react'

export function useStaff() {
  const [staff, setStaff] = useState<any[] | null>(null)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetch('/api/admin/staff')
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        if (mounted) setStaff(data)
      } catch (e) {
        if (mounted) setError(e)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  return {
    staff: staff || [],
    isLoading: staff === null && !error,
    isError: error,
    mutate: () => {},
  }
}
