"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useGridModel, dayLabel, prettyTime, type TimetableGrid } from "@/lib/hooks/use-timetable"

/** Deterministic pastel tint per subject so the same subject keeps its colour. */
const TINTS = [
  "bg-blue-50 border-blue-200 text-blue-900",
  "bg-emerald-50 border-emerald-200 text-emerald-900",
  "bg-amber-50 border-amber-200 text-amber-900",
  "bg-violet-50 border-violet-200 text-violet-900",
  "bg-rose-50 border-rose-200 text-rose-900",
  "bg-cyan-50 border-cyan-200 text-cyan-900",
  "bg-lime-50 border-lime-200 text-lime-900",
  "bg-orange-50 border-orange-200 text-orange-900",
]

function tintFor(subjectId: string) {
  let hash = 0
  for (let i = 0; i < subjectId.length; i++) hash = (hash * 31 + subjectId.charCodeAt(i)) % 997
  return TINTS[hash % TINTS.length]!
}

interface Props {
  grid: TimetableGrid | undefined
  isLoading?: boolean
  canManage?: boolean
  onCreate?: (day: string, startTime: string) => void
  onEdit?: (slotId: string) => void
  onDelete?: (slotId: string) => void
  emptyHint?: string
}

export function WeeklyTimetable({
  grid,
  isLoading,
  canManage,
  onCreate,
  onEdit,
  onDelete,
  emptyHint,
}: Props) {
  const model = useGridModel(grid)
  const { days, periods } = model

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading timetable…
      </div>
    )
  }

  if (!grid) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        {emptyHint ?? "No timetable available for this view."}
      </div>
    )
  }

  if (days.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        No timetable has been published yet.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="w-24 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Period
            </th>
            {days.map((day) => (
              <th key={day} className="text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {dayLabel(day)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.length === 0 && (
            <tr>
              <td colSpan={days.length + 1} className="py-10 text-center text-sm text-muted-foreground">
                No periods scheduled yet.
              </td>
            </tr>
          )}
          {periods.map((period) => (
            <tr key={period.startTime}>
              <td className="align-top py-1 pr-2">
                <div className="text-xs font-medium">{prettyTime(period.startTime)}</div>
                <div className="text-[11px] text-muted-foreground">{prettyTime(period.endTime)}</div>
              </td>
              {days.map((day) => {
                const slot = model.cell(day, period.startTime)
                if (!slot) {
                  return (
                    <td key={`${day}-${period.startTime}`} className="align-top">
                      <button
                        type="button"
                        disabled={!canManage}
                        onClick={() => onCreate?.(day, period.startTime)}
                        className={cn(
                          "group h-full min-h-[74px] w-full rounded-md border border-dashed p-2 text-left text-xs text-muted-foreground transition",
                          canManage
                            ? "hover:border-primary/50 hover:bg-muted/60 hover:text-foreground"
                            : "cursor-default opacity-60",
                        )}
                      >
                        {canManage ? (
                          <span className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                            <Plus className="h-3 w-3" /> Add class
                          </span>
                        ) : (
                          <span>—</span>
                        )}
                      </button>
                    </td>
                  )
                }

                return (
                  <td key={`${day}-${period.startTime}`} className="align-top">
                    <div
                      className={cn(
                        "relative min-h-[74px] rounded-md border p-2 text-xs",
                        tintFor(slot.subjectId),
                        slot.isCurrent && "ring-2 ring-primary ring-offset-1",
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold leading-tight">{slot.subjectName}</span>
                        {slot.isCurrent && (
                          <Badge variant="default" className="h-4 shrink-0 px-1 text-[10px]">
                            Now
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 truncate text-[11px] opacity-80">{slot.teacherName ?? "Unassigned"}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] opacity-70">
                        {grid.scope.kind === "teacher" && (
                          <span className="truncate">
                            {slot.className}
                            {slot.sectionName ? `-${slot.sectionName}` : ""}
                          </span>
                        )}
                        {slot.roomNo && <span>{slot.roomNo}</span>}
                      </div>

                      {canManage && (
                        <div className="absolute right-1 top-1 flex gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => onEdit?.(slot.id)}
                            aria-label={`Edit ${slot.subjectName}`}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5 text-destructive"
                            onClick={() => onDelete?.(slot.id)}
                            aria-label={`Delete ${slot.subjectName}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
