"use client"

import Link from "next/link"
import { useState } from "react"
import { getChildren } from "@/lib/data/tree"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTitle } from "@/components/branch-title"
import { BranchStatusDot } from "@/components/status-badge"
import { Card } from "@/components/ui"
import { cn } from "@/lib/utils"
import type { AppData, Branch, Task } from "@/types"

const NODE_WIDTH = 160
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
  height: number
  nodeHeight: number
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
      x: number
      y: number
    }
  | {
      id: string
      kind: "period-task"
      task: Task
      parentId: string
      depth: number
      side: Side
      height: number
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

function getBranchMapTasks(branchId: string, data: AppData, showAll: boolean) {
  return Object.values(data.tasks)
    .filter(
      (task) =>
        task.branchId === branchId &&
        (task.status === "in_progress" ||
          task.status === "recurring" ||
          task.status === "on_demand" ||
          (showAll && task.status === "paused")),
    )
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

function getPeriodTasks(branchId: string, data: AppData) {
  return Object.values(data.tasks)
    .filter((task) => task.branchId === branchId && task.status === "period")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

function estimateTextNodeHeight(text: string, extraLength = 0) {
  const visibleLength = text.length + extraLength
  const lines = Math.max(1, Math.ceil(visibleLength / 13))
  return Math.max(NODE_MIN_HEIGHT, lines * NODE_LINE_HEIGHT + NODE_VERTICAL_PADDING)
}

function estimateBranchNodeHeight(branch: Branch) {
  return estimateTextNodeHeight(branch.title, branch.timing ? 12 : 0)
}

function estimateTaskNodeHeight(task: Task) {
  return estimateTextNodeHeight(task.title)
}

function getStackHeight(items: Array<{ height: number }>, gap: number) {
  if (!items.length) return 0
  return items.reduce((total, item) => total + item.height, 0) + gap * (items.length - 1)
}

function buildBranchLayout(branch: Branch, data: AppData, showAll: boolean): BranchLayout {
  const children = getVisibleChildren(data, branch.id, showAll).map((child) => buildBranchLayout(child, data, showAll))
  const periodTasks = getPeriodTasks(branch.id, data)
  const periodTaskLayouts = periodTasks.map((task) => ({ height: estimateTaskNodeHeight(task), width: NODE_WIDTH }))
  const childItems = [...children, ...periodTaskLayouts]
  const nodeHeight = estimateBranchNodeHeight(branch)
  const childrenHeight = getStackHeight(childItems, VERTICAL_GAP)
  const childrenWidth = childItems.length ? Math.max(...childItems.map((child) => child.width)) : 0

  return {
    branch,
    children,
    periodTasks,
    height: Math.max(nodeHeight, childrenHeight),
    nodeHeight,
    width: NODE_WIDTH + (childItems.length ? HORIZONTAL_GAP + childrenWidth : 0),
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
    x,
    y,
  })
  edges.push({ fromId: parentId, toId: layout.branch.id })

  if (!layout.children.length && !layout.periodTasks.length) return

  const periodTaskLayouts = layout.periodTasks.map((task) => ({
    kind: "period-task" as const,
    task,
    height: estimateTaskNodeHeight(task),
  }))
  const childItems = [
    ...layout.children.map((child) => ({ kind: "branch" as const, layout: child, height: child.height })),
    ...periodTaskLayouts,
  ]
  const childrenHeight = getStackHeight(childItems, VERTICAL_GAP)
  let cursor = y - childrenHeight / 2

  for (const item of childItems) {
    const childY = cursor + item.height / 2
    const childX = x + (side === "right" ? 1 : -1) * (NODE_WIDTH + HORIZONTAL_GAP)

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
    } else {
      const id = `task:${item.task.id}`
      nodes.push({
        id,
        kind: "period-task",
        task: item.task,
        parentId: layout.branch.id,
        depth: depth + 1,
        side,
        height: item.height,
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
  const x = direction * (CENTER_SIZE / 2 + HORIZONTAL_GAP + NODE_WIDTH / 2)
  const orderedLayouts = side === "left" ? [...layouts].reverse() : layouts

  for (const layout of orderedLayouts) {
    const y = cursor + layout.height / 2
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
      minX: Math.min(result.minX, node.x - NODE_WIDTH / 2),
      maxX: Math.max(result.maxX, node.x + NODE_WIDTH / 2),
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
              const parentEdgeX = parent.x + direction * (edge.fromId ? NODE_WIDTH / 2 : CENTER_SIZE / 2)
              const childEdgeX = child.x - direction * (NODE_WIDTH / 2)
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

          {layout.nodes.map((node) => (
            node.kind === "branch" ? (
              <BranchBubble
                key={node.id}
                branch={node.branch}
                tasks={node.tasks}
                showAll={showAll}
                depth={node.depth}
                height={node.height}
                x={node.x}
                y={node.y}
                onTooltipChange={setTooltip}
              />
            ) : (
              <PeriodTaskBubble key={node.id} task={node.task} height={node.height} x={node.x} y={node.y} />
            )
          ))}
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
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    task.status === "in_progress" && "bg-red-500",
                    task.status === "recurring" && "border border-blue-600 bg-transparent",
                    task.status === "on_demand" && "bg-yellow-500",
                    task.status === "paused" && "bg-yellow-500",
                  )}
                  aria-hidden="true"
                />
                <span className="min-w-0 break-words">
                  {task.title}
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
  x,
  y,
  onTooltipChange,
}: {
  branch: Branch
  tasks: Task[]
  showAll: boolean
  depth: number
  height: number
  x: number
  y: number
  onTooltipChange: (tooltip: TooltipState) => void
}) {
  const visibleTasks = tasks.filter(
    (task) =>
      task.status === "in_progress" ||
      task.status === "recurring" ||
      task.status === "on_demand" ||
      (showAll && task.status === "paused"),
  )
  const inProgressCount = tasks.filter((task) => task.status === "in_progress").length
  const recurringCount = tasks.filter((task) => task.status === "recurring").length
  const onDemandCount = tasks.filter((task) => task.status === "on_demand").length
  const pausedCount = showAll ? tasks.filter((task) => task.status === "paused").length : 0

  function showTooltip(element: HTMLDivElement) {
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
      style={{ left: x, top: y, width: NODE_WIDTH }}
      onMouseEnter={(event) => showTooltip(event.currentTarget)}
      onMouseLeave={() => onTooltipChange(null)}
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
        <BranchTitle branch={branch} className="min-w-0 break-words" />
        <BranchTimingBadge branch={branch} compact />
        <BranchStatusDot status={branch.status} />
        {inProgressCount ? (
          <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white">
            {inProgressCount}
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
        {pausedCount ? (
          <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-yellow-500 px-1 text-[10px] font-bold leading-4 text-white">
            {pausedCount}
          </span>
        ) : null}
      </Link>
    </div>
  )
}

function PeriodTaskBubble({ task, height, x, y }: { task: Task; height: number; x: number; y: number }) {
  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y, width: NODE_WIDTH }}
    >
      <div
        style={{ height }}
        className="flex box-border min-h-8 items-center justify-center rounded-full border border-purple-200 bg-purple-50 px-2 py-1 text-center text-xs font-semibold leading-[16px] text-purple-800 shadow-sm"
        title="Задача периода"
      >
        <span className="min-w-0 break-words">{task.title}</span>
      </div>
    </div>
  )
}
