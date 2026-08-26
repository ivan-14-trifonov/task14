import Link from "next/link"
import { getChildren } from "@/lib/data/tree"
import { BranchTag } from "@/components/branch-tag"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTitle } from "@/components/branch-title"
import { BranchStatusDot } from "@/components/status-badge"
import { Card } from "@/components/ui"
import { cn } from "@/lib/utils"
import type { AppData, Branch, Task } from "@/types"

const CENTER_RADIUS = 260
const LEVEL_GAP = 190
const NODE_WIDTH = 220
const NODE_HEIGHT = 44
const MAP_PADDING = 80

type MapNode = {
  id: string
  branch: Branch
  inProgressTasks: Task[]
  depth: number
  x: number
  y: number
}

type MapEdge = {
  fromX: number
  fromY: number
  toX: number
  toY: number
}

function getBranchInProgressTasks(branchId: string, data: AppData) {
  return Object.values(data.tasks)
    .filter((task) => task.branchId === branchId && task.status === "in_progress")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

function getBranchLeafCount(branch: Branch, data: AppData): number {
  const children = getChildren(data, branch.id)
  if (!children.length) return 1
  return children.reduce((total, child) => total + getBranchLeafCount(child, data), 0)
}

function polarPoint(angle: number, radius: number) {
  const radians = (angle * Math.PI) / 180
  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  }
}

function buildMindMapLayout(data: AppData) {
  const roots = getChildren(data, null)
  const nodes: MapNode[] = []
  const edges: MapEdge[] = []

  function placeBranch(branch: Branch, angle: number, radius: number, spread: number, parent: { x: number; y: number }) {
    const point = polarPoint(angle, radius)
    nodes.push({
      id: branch.id,
      branch,
      inProgressTasks: getBranchInProgressTasks(branch.id, data),
      depth: Math.round((radius - CENTER_RADIUS) / LEVEL_GAP),
      x: point.x,
      y: point.y,
    })
    edges.push({ fromX: parent.x, fromY: parent.y, toX: point.x, toY: point.y })

    const children = getChildren(data, branch.id)
    if (!children.length) return

    const totalLeaves = children.reduce((total, child) => total + getBranchLeafCount(child, data), 0)
    let cursor = angle - spread / 2

    for (const child of children) {
      const childLeaves = getBranchLeafCount(child, data)
      const childSpread = (childLeaves / totalLeaves) * spread
      const childAngle = cursor + childSpread / 2
      placeBranch(child, childAngle, radius + LEVEL_GAP, Math.max(18, childSpread * 0.9), point)
      cursor += childSpread
    }
  }

  const rootStep = 360 / roots.length
  roots.forEach((branch, index) => {
    const angle = -90 + index * rootStep
    placeBranch(branch, angle, CENTER_RADIUS, Math.min(120, rootStep * 0.82), { x: 0, y: 0 })
  })

  const bounds = [...nodes.map((node) => ({ x: node.x, y: node.y })), { x: 0, y: 0 }].reduce(
    (result, point) => ({
      minX: Math.min(result.minX, point.x - NODE_WIDTH / 2),
      maxX: Math.max(result.maxX, point.x + NODE_WIDTH / 2),
      minY: Math.min(result.minY, point.y - NODE_HEIGHT / 2),
      maxY: Math.max(result.maxY, point.y + NODE_HEIGHT / 2),
    }),
    { minX: 0, maxX: 0, minY: 0, maxY: 0 },
  )

  const offsetX = MAP_PADDING - bounds.minX
  const offsetY = MAP_PADDING - bounds.minY
  const width = bounds.maxX - bounds.minX + MAP_PADDING * 2
  const height = bounds.maxY - bounds.minY + MAP_PADDING * 2

  return {
    center: { x: offsetX, y: offsetY },
    edges: edges.map((edge) => ({
      fromX: edge.fromX + offsetX,
      fromY: edge.fromY + offsetY,
      toX: edge.toX + offsetX,
      toY: edge.toY + offsetY,
    })),
    nodes: nodes.map((node) => ({ ...node, x: node.x + offsetX, y: node.y + offsetY })),
    width,
    height,
  }
}

export function MindMap({ data }: { data: AppData }) {
  const roots = getChildren(data, null)

  if (!roots.length) {
    return <Card className="p-6 text-sm text-muted-foreground">Дерево пустое. Создайте первое направление.</Card>
  }

  const layout = buildMindMapLayout(data)

  return (
    <div className="overflow-auto rounded-lg border bg-white p-4">
      <div className="relative" style={{ width: layout.width, height: layout.height }}>
        <svg className="absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
          {layout.edges.map((edge, index) => (
            <line
              key={`${edge.fromX}-${edge.fromY}-${edge.toX}-${edge.toY}-${index}`}
              x1={edge.fromX}
              y1={edge.fromY}
              x2={edge.toX}
              y2={edge.toY}
              className="stroke-slate-200"
              strokeWidth="2"
            />
          ))}
        </svg>

        <div
          className="absolute flex size-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-center text-sm font-semibold text-blue-950 shadow-sm"
          style={{ left: layout.center.x, top: layout.center.y }}
        >
          Дерево задач
        </div>

        {layout.nodes.map((node) => (
          <BranchBubble
            key={node.id}
            branch={node.branch}
            inProgressTasks={node.inProgressTasks}
            depth={node.depth}
            x={node.x}
            y={node.y}
          />
        ))}
      </div>
    </div>
  )
}

function BranchBubble({
  branch,
  inProgressTasks,
  depth,
  x,
  y,
}: {
  branch: Branch
  inProgressTasks: Task[]
  depth: number
  x: number
  y: number
}) {
  return (
    <div className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y, width: NODE_WIDTH }}>
      <Link
        href={`/branches/${branch.id}`}
        className={cn(
          "flex min-h-11 items-center justify-center gap-2 rounded-full border bg-white px-4 py-2 text-center text-sm font-semibold shadow-sm transition hover:border-blue-200 hover:bg-blue-50",
          depth === 0 && "border-blue-200 bg-blue-50 text-blue-950",
          branch.status === "paused" && "text-muted-foreground line-through",
        )}
      >
        <BranchTitle branch={branch} />
        <BranchTag tag={branch.tag} />
        <BranchTimingBadge branch={branch} compact />
        <BranchStatusDot status={branch.status} />
        {inProgressTasks.length ? (
          <span className="ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold leading-5 text-white">
            {inProgressTasks.length}
          </span>
        ) : null}
      </Link>
      {inProgressTasks.length ? (
        <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-64 -translate-x-1/2 rounded-md border bg-white p-3 text-left text-xs shadow-lg group-hover:block">
          <p className="mb-2 font-semibold text-foreground">Задачи в работе</p>
          <ul className="grid gap-1 text-muted-foreground">
            {inProgressTasks.map((task) => (
              <li key={task.id} className="break-words">
                {task.title}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
