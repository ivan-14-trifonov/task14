"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { getChildren } from "@/lib/data/tree"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTitle } from "@/components/branch-title"
import { BranchStatusDot } from "@/components/status-badge"
import { Card } from "@/components/ui"
import { cn, formatDate } from "@/lib/utils"
import type { AppData, Branch, Task } from "@/types"

const NODE_MIN_WIDTH = 160
const NODE_MAX_WIDTH = 260
const NODE_MIN_HEIGHT = 34
const NODE_LINE_HEIGHT = 16
const NODE_VERTICAL_PADDING = 8
const HORIZONTAL_GAP = 36
const VERTICAL_GAP = 10
const ROOT_GAP = 16
const CENTER_SIZE = 88
const MAP_PADDING = 24

type Side = "left" | "right"

type BranchLayout = {
  branch: Branch
  children: BranchLayout[]
  periodTasks: Task[]
  todayTasks: Task[]
  height: number
  nodeHeight: number
  nodeWidth: number
  width: number
}

type MapNode =
  | {
      id: string
      kind: "branch"
      branch: Branch
      tasks: Task[]
      parentId: string | null
      depth: number
      side: Side
      height: number
      width: number
      x: number
      y: number
    }
  | {
      id: string
      kind: "today-task"
      task: Task
      parentId: string
      depth: number
      side: Side
      height: number
      width: number
      x: number
      y: number
    }
  | {
      id: string
      kind: "period-group"
      tasks: Task[]
      parentId: string
      depth: number
      side: Side
      height: number
      width: number
      x: number
      y: number
    }

type MapEdge = {
  fromId: string | null
  toId: string
}

type TooltipState = {
  tasks: Task[]
  x: number
  y: number
} | null

function getVisibleChildren(data: AppData, parentId: string | null, showAll: boolean) {
  return getChildren(data, parentId).filter((branch) => showAll || branch.status !== "paused")
}

function getNearestVisibleAncestorIdForPausedBranch(branchId: string, data: AppData) {
  let current: Branch | undefined = data.branches[branchId]
  let hiddenByPause = false

  while (current) {
    if (current.status === "paused") hiddenByPause = true
    const parent: Branch | undefined = current.parentId ? data.branches[current.parentId] : undefined
    if (hiddenByPause && parent?.status !== "paused") return parent?.id ?? null
    current = parent
  }

  return null
}

function getBranchMapTasks(branchId: string, data: AppData, showAll: boolean) {
  const directTasks = Object.values(data.tasks).filter(
    (task) =>
      task.branchId === branchId &&
      (task.status === "in_progress" ||
        task.status === "recurring" ||
        task.status === "on_demand" ||
        task.status === "calendar" ||
        task.status === "uncontrolled" ||
        (showAll && task.status === "paused")),
  )
  const hiddenPausedTasks = showAll
    ? []
    : Object.values(data.tasks).filter(
        (task) =>
          task.status === "uncontrolled" &&
          task.branchId !== branchId &&
          getNearestVisibleAncestorIdForPausedBranch(task.branchId, data) === branchId,
      )

  return [...directTasks, ...hiddenPausedTasks]
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

function getPeriodTasks(branchId: string, data: AppData) {
  return Object.values(data.tasks)
    .filter((task) => task.branchId === branchId && task.status === "period")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

function getTodayTasks(branchId: string, data: AppData) {
  return Object.values(data.tasks)
    .filter((task) => task.branchId === branchId && task.status === "today")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

function getTextCharsPerLine(width: number) {
  return Math.max(13, Math.floor(width / 11))
}

function estimateTextNodeHeight(text: string, extraLength = 0, width = NODE_MIN_WIDTH) {
  const visibleLength = text.length + extraLength
  const lines = Math.max(1, Math.ceil(visibleLength / getTextCharsPerLine(width)))
  return Math.max(NODE_MIN_HEIGHT, lines * NODE_LINE_HEIGHT + NODE_VERTICAL_PADDING)
}

function estimateBranchNodeWidth(branch: Branch, tasks: Task[], showAll: boolean) {
  const indicatorCount = [
    tasks.some((task) => task.status === "in_progress"),
    tasks.some((task) => task.status === "uncontrolled"),
    tasks.some((task) => task.status === "recurring"),
    tasks.some((task) => task.status === "on_demand"),
    tasks.some((task) => task.status === "calendar"),
    showAll && tasks.some((task) => task.status === "paused"),
    Boolean(branch.timing),
    branch.status === "in_progress",
  ].filter(Boolean).length
  const visibleLength = branch.title.length + indicatorCount * 3
  const overflow = Math.max(0, visibleLength - getTextCharsPerLine(NODE_MIN_WIDTH))
  return Math.min(NODE_MAX_WIDTH, NODE_MIN_WIDTH + overflow * 9)
}

function estimateBranchNodeHeight(branch: Branch, width: number) {
  return estimateTextNodeHeight(branch.title, branch.timing ? 12 : 0, width)
}

function estimateTaskNodeWidth(task: Task) {
  const overflow = Math.max(0, task.title.length - getTextCharsPerLine(NODE_MIN_WIDTH))
  return Math.min(NODE_MAX_WIDTH, NODE_MIN_WIDTH + overflow * 8)
}

function estimateTaskNodeHeight(task: Task, width = NODE_MIN_WIDTH) {
  return estimateTextNodeHeight(task.title, 0, width)
}

function estimatePeriodGroupNodeWidth(tasks: Task[]) {
  const longestTitle = Math.max(...tasks.map((task) => task.title.length), 0)
  const overflow = Math.max(0, longestTitle + 2 - getTextCharsPerLine(NODE_MIN_WIDTH))
  return Math.min(NODE_MAX_WIDTH, NODE_MIN_WIDTH + overflow * 8)
}

function estimatePeriodGroupNodeHeight(tasks: Task[], width: number) {
  const contentHeight = tasks.reduce((total, task) => {
    const lines = Math.max(1, Math.ceil((task.title.length + 2) / getTextCharsPerLine(width)))
    return total + lines * NODE_LINE_HEIGHT
  }, 0)
  return Math.max(NODE_MIN_HEIGHT, contentHeight + NODE_VERTICAL_PADDING)
}

function getStackHeight(items: Array<{ height: number }>, gap: number) {
  if (!items.length) return 0
  return items.reduce((total, item) => total + item.height, 0) + gap * (items.length - 1)
}

function buildBranchLayout(branch: Branch, data: AppData, showAll: boolean): BranchLayout {
  const children = getVisibleChildren(data, branch.id, showAll).map((child) => buildBranchLayout(child, data, showAll))
  const periodTasks = getPeriodTasks(branch.id, data)
  const todayTasks = getTodayTasks(branch.id, data)
  const mapTasks = getBranchMapTasks(branch.id, data, showAll)
  const nodeWidth = estimateBranchNodeWidth(branch, mapTasks, showAll)
  const todayTaskLayouts = todayTasks.map((task) => {
    const width = estimateTaskNodeWidth(task)
    return { height: estimateTaskNodeHeight(task, width), width }
  })
  const periodGroupLayout = periodTasks.length
    ? {
        width: estimatePeriodGroupNodeWidth(periodTasks),
      }
    : null
  const periodGroupWithHeight = periodGroupLayout
    ? { ...periodGroupLayout, height: estimatePeriodGroupNodeHeight(periodTasks, periodGroupLayout.width) }
    : null
  const childItems = [...children, ...todayTaskLayouts, ...(periodGroupWithHeight ? [periodGroupWithHeight] : [])]
  const nodeHeight = estimateBranchNodeHeight(branch, nodeWidth)
  const childrenHeight = getStackHeight(childItems, VERTICAL_GAP)
  const childrenWidth = childItems.length ? Math.max(...childItems.map((child) => child.width)) : 0

  return {
    branch,
    children,
    periodTasks,
    todayTasks,
    height: Math.max(nodeHeight, childrenHeight),
    nodeHeight,
    nodeWidth,
    width: nodeWidth + (childItems.length ? HORIZONTAL_GAP + childrenWidth : 0),
  }
}

function placeBranchLayout({
  layout,
  data,
  depth,
  edges,
  nodes,
  parentId,
  showAll,
  side,
  x,
  y,
}: {
  layout: BranchLayout
  data: AppData
  depth: number
  edges: MapEdge[]
  nodes: MapNode[]
  parentId: string | null
  showAll: boolean
  side: Side
  x: number
  y: number
}) {
  nodes.push({
    id: layout.branch.id,
    kind: "branch",
    branch: layout.branch,
    tasks: getBranchMapTasks(layout.branch.id, data, showAll),
    parentId,
    depth,
    side,
    height: layout.nodeHeight,
    width: layout.nodeWidth,
    x,
    y,
  })
  edges.push({ fromId: parentId, toId: layout.branch.id })

  if (!layout.children.length && !layout.periodTasks.length && !layout.todayTasks.length) return

  const todayTaskLayouts = layout.todayTasks.map((task) => ({
    kind: "today-task" as const,
    task,
    width: estimateTaskNodeWidth(task),
  }))
  const todayTaskLayoutsWithHeight = todayTaskLayouts.map((item) => ({
    ...item,
    height: estimateTaskNodeHeight(item.task, item.width),
  }))
  const periodGroupLayout = layout.periodTasks.length
    ? {
        kind: "period-group" as const,
        tasks: layout.periodTasks,
        width: estimatePeriodGroupNodeWidth(layout.periodTasks),
      }
    : null
  const periodGroupWithHeight = periodGroupLayout
    ? { ...periodGroupLayout, height: estimatePeriodGroupNodeHeight(layout.periodTasks, periodGroupLayout.width) }
    : null
  const childItems = [
    ...layout.children.map((child) => ({ kind: "branch" as const, layout: child, height: child.height, width: child.nodeWidth })),
    ...todayTaskLayoutsWithHeight,
    ...(periodGroupWithHeight ? [periodGroupWithHeight] : []),
  ]
  const childrenHeight = getStackHeight(childItems, VERTICAL_GAP)
  let cursor = y - childrenHeight / 2

  for (const item of childItems) {
    const childY = cursor + item.height / 2
    const childX = x + (side === "right" ? 1 : -1) * (layout.nodeWidth / 2 + HORIZONTAL_GAP + item.width / 2)

    if (item.kind === "branch") {
      placeBranchLayout({
        layout: item.layout,
        data,
        depth: depth + 1,
        edges,
        nodes,
        parentId: layout.branch.id,
        showAll,
        side,
        x: childX,
        y: childY,
      })
    } else if (item.kind === "today-task") {
      const id = `today:${item.task.id}`
      nodes.push({
        id,
        kind: "today-task",
        task: item.task,
        parentId: layout.branch.id,
        depth: depth + 1,
        side,
        height: item.height,
        width: item.width,
        x: childX,
        y: childY,
      })
      edges.push({ fromId: layout.branch.id, toId: id })
    } else {
      const id = `period-group:${layout.branch.id}`
      nodes.push({
        id,
        kind: "period-group",
        tasks: item.tasks,
        parentId: layout.branch.id,
        depth: depth + 1,
        side,
        height: item.height,
        width: item.width,
        x: childX,
        y: childY,
      })
      edges.push({ fromId: layout.branch.id, toId: id })
    }

    cursor += item.height + VERTICAL_GAP
  }
}

function placeRootLayouts({
  data,
  edges,
  layouts,
  nodes,
  showAll,
  side,
}: {
  data: AppData
  edges: MapEdge[]
  layouts: BranchLayout[]
  nodes: MapNode[]
  showAll: boolean
  side: Side
}) {
  const rootsHeight = getStackHeight(layouts, ROOT_GAP)
  let cursor = -rootsHeight / 2
  const direction = side === "right" ? 1 : -1
  const orderedLayouts = side === "left" ? [...layouts].reverse() : layouts

  for (const layout of orderedLayouts) {
    const y = cursor + layout.height / 2
    const x = direction * (CENTER_SIZE / 2 + HORIZONTAL_GAP + layout.nodeWidth / 2)
    placeBranchLayout({ layout, data, depth: 0, edges, nodes, parentId: null, showAll, side, x, y })
    cursor += layout.height + ROOT_GAP
  }
}

function buildMindMapLayout(data: AppData, showAll: boolean) {
  const rootLayouts = getVisibleChildren(data, null, showAll).map((branch) => buildBranchLayout(branch, data, showAll))
  const rightRootCount = Math.ceil(rootLayouts.length / 2)
  const rightRoots = rootLayouts.slice(0, rightRootCount)
  const leftRoots = rootLayouts.slice(rightRootCount)
  const nodes: MapNode[] = []
  const edges: MapEdge[] = []

  placeRootLayouts({ data, edges, layouts: rightRoots, nodes, showAll, side: "right" })
  placeRootLayouts({ data, edges, layouts: leftRoots, nodes, showAll, side: "left" })

  const bounds = nodes.reduce(
    (result, node) => ({
      minX: Math.min(result.minX, node.x - node.width / 2),
      maxX: Math.max(result.maxX, node.x + node.width / 2),
      minY: Math.min(result.minY, node.y - node.height / 2),
      maxY: Math.max(result.maxY, node.y + node.height / 2),
    }),
    {
      minX: -CENTER_SIZE / 2,
      maxX: CENTER_SIZE / 2,
      minY: -CENTER_SIZE / 2,
      maxY: CENTER_SIZE / 2,
    },
  )

  const offsetX = MAP_PADDING - bounds.minX
  const offsetY = MAP_PADDING - bounds.minY
  const width = bounds.maxX - bounds.minX + MAP_PADDING * 2
  const height = bounds.maxY - bounds.minY + MAP_PADDING * 2

  return {
    center: { x: offsetX, y: offsetY },
    edges,
    nodes: nodes.map((node) => ({ ...node, x: node.x + offsetX, y: node.y + offsetY })),
    width,
    height,
  }
}

export function MindMap({ data }: { data: AppData }) {
  const [showAll, setShowAll] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>(null)
  const roots = getChildren(data, null)

  useEffect(() => {
    if (!tooltip) return

    function closeOnOutsidePointer() {
      setTooltip(null)
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setTooltip(null)
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer)
    document.addEventListener("keydown", closeOnEscape)
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer)
      document.removeEventListener("keydown", closeOnEscape)
    }
  }, [tooltip])

  if (!roots.length) {
    return <Card className="p-6 text-sm text-muted-foreground">Дерево пустое. Создайте первое направление.</Card>
  }

  const layout = buildMindMapLayout(data, showAll)
  const nodesById = new Map(layout.nodes.map((node) => [node.id, node]))

  return (
    <>
      <label className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <input
          type="checkbox"
          checked={showAll}
          onChange={(event) => {
            setShowAll(event.target.checked)
            setTooltip(null)
          }}
          className="size-4 rounded border"
        />
        Показать всё
      </label>

      <div className="overflow-auto rounded-lg border bg-white p-2">
        <div className="relative" style={{ width: layout.width, height: layout.height }}>
          <svg className="absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
            {layout.edges.map((edge) => {
              const child = nodesById.get(edge.toId)
              const parent = edge.fromId ? nodesById.get(edge.fromId) : layout.center
              if (!child || !parent) return null
              const direction = child.side === "right" ? 1 : -1
              const parentWidth = edge.fromId ? (parent as MapNode).width : CENTER_SIZE
              const parentEdgeX = parent.x + direction * (parentWidth / 2)
              const childEdgeX = child.x - direction * (child.width / 2)
              const middleX = parentEdgeX + (childEdgeX - parentEdgeX) / 2
              const path = `M ${parentEdgeX} ${parent.y} H ${middleX} V ${child.y} H ${childEdgeX}`

              return (
                <path
                  key={`${edge.fromId ?? "root"}-${edge.toId}`}
                  d={path}
                  fill="none"
                  className="stroke-slate-200"
                  strokeWidth="2"
                />
              )
            })}
          </svg>

          <div
            className="absolute flex size-[88px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-200 bg-blue-50 px-2 text-center text-xs font-semibold text-blue-950 shadow-sm"
            style={{ left: layout.center.x, top: layout.center.y }}
          >
            Дерево задач
          </div>

          {layout.nodes.map((node) => {
            if (node.kind === "branch") {
              return (
              <BranchBubble
                key={node.id}
                branch={node.branch}
                tasks={node.tasks}
                showAll={showAll}
                depth={node.depth}
                height={node.height}
                width={node.width}
                x={node.x}
                y={node.y}
                onTooltipChange={setTooltip}
              />
              )
            }
            if (node.kind === "today-task") {
              return <TodayTaskBubble key={node.id} task={node.task} height={node.height} width={node.width} x={node.x} y={node.y} />
            }
            return <PeriodGroupBubble key={node.id} tasks={node.tasks} height={node.height} width={node.width} x={node.x} y={node.y} />
          })}
        </div>
      </div>

      {tooltip ? (
        <div
          className="pointer-events-none fixed z-[9999] w-64 -translate-x-1/2 rounded-md border bg-white px-4 py-3 text-left text-xs shadow-2xl"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          <ul className="space-y-1 text-muted-foreground">
            {tooltip.tasks.map((task) => (
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
                    task.status === "calendar" && "bg-cyan-500",
                    task.status === "paused" && "bg-yellow-500",
                  )}
                  aria-hidden="true"
                >
                  {task.status === "uncontrolled" ? "×" : null}
                </span>
                <span className={cn("min-w-0 break-words", task.status === "uncontrolled" && "line-through")}>
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

function BranchBubble({
  branch,
  tasks,
  showAll,
  depth,
  height,
  width,
  x,
  y,
  onTooltipChange,
}: {
  branch: Branch
  tasks: Task[]
  showAll: boolean
  depth: number
  height: number
  width: number
  x: number
  y: number
  onTooltipChange: (tooltip: TooltipState) => void
}) {
  const visibleTasks = tasks.filter(
    (task) =>
      task.status === "in_progress" ||
      task.status === "recurring" ||
      task.status === "on_demand" ||
      task.status === "calendar" ||
      task.status === "uncontrolled" ||
      (showAll && task.status === "paused"),
  )
  const inProgressCount = tasks.filter((task) => task.status === "in_progress").length
  const uncontrolledCount = tasks.filter((task) => task.status === "uncontrolled").length
  const recurringCount = tasks.filter((task) => task.status === "recurring").length
  const onDemandCount = tasks.filter((task) => task.status === "on_demand").length
  const calendarCount = tasks.filter((task) => task.status === "calendar").length
  const pausedCount = showAll ? tasks.filter((task) => task.status === "paused").length : 0

  function showTooltip(element: HTMLElement) {
    if (!visibleTasks.length) return
    const rect = element.getBoundingClientRect()
    onTooltipChange({
      tasks: visibleTasks,
      x: rect.left + rect.width / 2,
      y: rect.bottom + 8,
    })
  }

  return (
    <div
      className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 hover:z-[9998]"
      style={{ left: x, top: y, width }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") showTooltip(event.currentTarget)
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") onTooltipChange(null)
      }}
      onFocus={(event) => showTooltip(event.currentTarget)}
      onBlur={() => onTooltipChange(null)}
    >
      <Link
        href={`/branches/${branch.id}`}
        style={{ height }}
        className={cn(
          "flex box-border min-h-8 items-center justify-center gap-1 rounded-full border bg-white px-2 py-1 text-center text-xs font-semibold leading-[16px] shadow-sm transition hover:border-blue-200 hover:bg-blue-50",
          depth === 0 && "border-blue-200 bg-blue-50 text-blue-950",
          branch.status === "paused" && "text-muted-foreground line-through",
        )}
      >
        <BranchTitle branch={branch} className="min-w-0 flex-1 break-words" />
        <BranchTimingBadge branch={branch} compact />
        <BranchStatusDot status={branch.status} />
        <span
          className="inline-flex shrink-0 flex-wrap items-center justify-center gap-1"
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            showTooltip(event.currentTarget)
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          {inProgressCount ? (
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
              {inProgressCount}
            </span>
          ) : null}
          {uncontrolledCount ? (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-red-50 px-1.5 text-[10px] font-bold leading-4 text-red-700 ring-1 ring-red-200"
              title="Не контролирую"
            >
              <span aria-hidden="true">×</span>
              {uncontrolledCount}
            </span>
          ) : null}
          {recurringCount ? (
            <span
              className="inline-flex box-border min-w-4 items-center justify-center rounded-full border border-blue-600 bg-transparent px-[3px] text-[10px] font-bold leading-[14px] text-blue-700"
              title="Повторяющиеся задачи"
            >
              {recurringCount}
            </span>
          ) : null}
          {onDemandCount ? (
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold leading-4 text-white">
              {onDemandCount}
            </span>
          ) : null}
          {calendarCount ? (
            <span
              className="inline-flex min-w-4 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-bold leading-4 text-white"
              title="Календарь"
            >
              {calendarCount}
            </span>
          ) : null}
          {pausedCount ? (
            <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold leading-4 text-white">
              {pausedCount}
            </span>
          ) : null}
        </span>
      </Link>
    </div>
  )
}

function TodayTaskBubble({ task, height, width, x, y }: { task: Task; height: number; width: number; x: number; y: number }) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y, width }}
    >
      <div
        style={{ height }}
        className="flex box-border min-h-8 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-center text-xs font-semibold leading-[16px] text-emerald-800 shadow-sm"
        title="Сегодня"
      >
        <span className="min-w-0 break-words">{task.title}</span>
      </div>
    </div>
  )
}

function PeriodGroupBubble({ tasks, height, width, x, y }: { tasks: Task[]; height: number; width: number; x: number; y: number }) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y, width }}
    >
      <div
        style={{ minHeight: height }}
        className="flex box-border items-center rounded-2xl border border-purple-200 bg-purple-50 px-3 py-2 text-left text-xs font-semibold leading-[16px] text-purple-800 shadow-sm"
        title="Задачи периода"
      >
        <ul className="grid min-w-0 gap-1">
          {tasks.map((task) => (
            <li key={task.id} className="flex min-w-0 gap-1.5">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-purple-500" aria-hidden="true" />
              <span className="min-w-0 break-words">{task.title}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
