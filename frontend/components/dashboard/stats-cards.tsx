"use client"

import type { ElementType } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface StatItem {
  title: string
  value: string | number
  hint?: string
  icon: ElementType
  tone?: string
}

interface Props {
  stats: StatItem[]
  isLoading?: boolean
  columns?: 2 | 3 | 4
}

export function StatsCards({ stats, isLoading, columns = 4 }: Props) {
  const grid =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 lg:grid-cols-4"

  if (isLoading) {
    return (
      <div className={cn("grid gap-4", grid)}>
        {Array.from({ length: stats.length || 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={cn("grid gap-4", grid)}>
      {stats.map((stat) => (
        <Card key={stat.title} className="border-0 shadow-sm">
          <CardContent className="flex items-center gap-4 p-4">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                stat.tone ?? "bg-primary/10 text-primary",
              )}
            >
              <stat.icon className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-2xl font-bold">{stat.value}</p>
              {stat.hint && <p className="truncate text-[11px] text-muted-foreground">{stat.hint}</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
