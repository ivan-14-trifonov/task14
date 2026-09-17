"use client"

import { useEffect, useRef, useState } from "react"
import { cn, formatDate } from "@/lib/utils"
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
  calendar,
  uncontrolled,
  planned,
  tasks = [],
  compact = false,
}: {
  inProgress: number
  recurring: number
  onDemand: number
  period: number
  calendar: number
  uncontrolled: number
  planned: number
  tasks?: Task[]
  compact?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>(null)
  const tooltipTasks = tasks.filter(
    (task) =>
      task.status === "in_progress" ||
      task.status === "recurring" ||
      task.status === "on_demand" ||
      task.status === "period" ||
      task.status === "calendar" ||
      task.status === "uncontrolled",
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

  function toggleTooltip(element: HTMLDivElement) {
    if (!tooltipTasks.length) return
    if (tooltipPosition) {
      setTooltipPosition(null)
      return
    }
    showTooltip(element)
  }

  useEffect(() => {
    if (!tooltipPosition) return

    function closeOnOutsidePointer(event: PointerEvent) {
      if (rootRef.current?.contains(event.target as Node)) return
      setTooltipPosition(null)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setTooltipPosition(null)
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [tooltipPosition])

  if (
    inProgress === 0 &&
    recurring === 0 &&
    onDemand === 0 &&
    period === 0 &&
    calendar === 0 &&
    uncontrolled === 0 &&
    planned === 0
  ) return null

  return (
    <>
      <div
        ref={rootRef}
        className={cn("flex w-fit flex-wrap items-center gap-1", compact && "mt-0.5")}
        onPointerEnter={(event) => {
          if (event.pointerType === "mouse") showTooltip(event.currentTarget)
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setTooltipPosition(null)
        }}
        onFocus={(event) => showTooltip(event.currentTarget)}
        onBlur={() => setTooltipPosition(null)}
        onClick={(event) => {
          event.preventDefault()
          event.stopPropagation()
          toggleTooltip(event.currentTarget)
        }}
        role={tooltipTasks.length ? "button" : undefined}
        tabIndex={tooltipTasks.length ? 0 : undefined}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return
          event.preventDefault()
          toggleTooltip(event.currentTarget)
        }}
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
        {calendar ? (
          <span
            className="inline-flex min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-4 text-white"
            title="Календарь"
          >
            {calendar}
          </span>
        ) : null}
        {uncontrolled ? (
          <span
            className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 text-[10px] font-bold leading-4 text-red-700 ring-1 ring-red-200"
            title="Не контролирую"
          >
            <span aria-hidden="true">×</span>
            {uncontrolled}
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
                    "shrink-0",
                    task.status === "uncontrolled"
                      ? "mt-0.5 flex size-3 items-center justify-center text-[11px] font-bold leading-none text-red-600"
                      : "mt-1.5 size-1.5 rounded-full",
                    task.status === "in_progress" && "bg-red-500",
                    task.status === "recurring" && "border border-blue-600 bg-transparent",
                    task.status === "on_demand" && "bg-yellow-500",
                    task.status === "period" && "bg-purple-500",
                    task.status === "calendar" && "bg-cyan-500",
                  )}
                  aria-hidden="true"
                >
                  {task.status === "uncontrolled" ? "×" : null}
                </span>
                <span className="min-w-0 break-words">
                  {task.status === "calendar" && task.calendar ? `${formatDate(task.calendar.at)} — ${task.title}` : task.title}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )
}
