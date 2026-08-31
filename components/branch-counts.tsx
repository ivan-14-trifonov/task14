"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import type { Task } from "@/types"

const TOOLTIP_WIDTH = 256
const TOOLTIP_ESTIMATED_HEIGHT = 180
const TOOLTIP_MARGIN = 12

type TooltipPosition = {
  x: number
  y: number
} | null

export function BranchCounts({
  inProgress,
  recurring,
  onDemand,
  period,
  planned,
  tasks = [],
  compact = false,
}: {
  inProgress: number
  recurring: number
  onDemand: number
  period: number
  planned: number
  tasks?: Task[]
  compact?: boolean
}) {
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>(null)
  if (inProgress === 0 && recurring === 0 && onDemand === 0 && period === 0 && planned === 0) return null
  const tooltipTasks = tasks.filter(
    (task) =>
      task.status === "in_progress" ||
      task.status === "recurring" ||
      task.status === "on_demand" ||
      task.status === "period",
  )

  function showTooltip(element: HTMLDivElement) {
    if (!tooltipTasks.length) return
    const rect = element.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const preferredX = rect.left + rect.width / 2
    const minX = TOOLTIP_MARGIN + TOOLTIP_WIDTH / 2
    const maxX = Math.max(minX, viewportWidth - TOOLTIP_MARGIN - TOOLTIP_WIDTH / 2)

    setTooltipPosition({
      x: Math.min(Math.max(preferredX, minX), maxX),
      y:
        rect.bottom + TOOLTIP_ESTIMATED_HEIGHT + TOOLTIP_MARGIN > window.innerHeight
          ? Math.max(TOOLTIP_MARGIN, rect.top - TOOLTIP_ESTIMATED_HEIGHT - 8)
          : rect.bottom + 8,
    })
  }

  return (
    <>
      <div
        className={cn("flex w-fit flex-wrap items-center gap-1", compact && "mt-0.5")}
        onMouseEnter={(event) => showTooltip(event.currentTarget)}
        onMouseLeave={() => setTooltipPosition(null)}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setTooltipPosition(null)}
      >
        {inProgress ? (
          <span
            className="inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white"
            title="В работе"
          >
            {inProgress}
          </span>
        ) : null}
        {recurring ? (
          <span
            className="inline-flex box-border min-w-4 items-center justify-center rounded-full border border-blue-600 bg-transparent px-[3px] text-[10px] font-bold leading-[14px] text-blue-700"
            title="Повторяющиеся задачи"
          >
            {recurring}
          </span>
        ) : null}
        {onDemand ? (
          <span
            className="inline-flex min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold leading-4 text-white"
            title="По требованию"
          >
            {onDemand}
          </span>
        ) : null}
        {period ? (
          <span
            className="inline-flex min-w-4 items-center justify-center rounded-full bg-purple-600 px-1 text-[10px] font-bold leading-4 text-white"
            title="Задачи периода"
          >
            {period}
          </span>
        ) : null}
        {planned ? (
          <span
            className="inline-flex min-w-4 items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-bold leading-4 text-slate-600"
            title="В плане"
          >
            {planned}
          </span>
        ) : null}
      </div>
      {tooltipTasks.length && tooltipPosition ? (
        <div
          className="pointer-events-none fixed z-[9999] w-64 -translate-x-1/2 rounded-md border bg-white px-4 py-3 text-left text-xs shadow-2xl"
          style={{ left: tooltipPosition.x, top: tooltipPosition.y }}
        >
          <ul className="space-y-1 text-muted-foreground">
            {tooltipTasks.map((task) => (
              <li key={task.id} className="flex gap-2">
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    task.status === "in_progress" && "bg-red-500",
                    task.status === "recurring" && "border border-blue-600 bg-transparent",
                    task.status === "on_demand" && "bg-yellow-500",
                    task.status === "period" && "bg-purple-500",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">{task.title}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )
}
