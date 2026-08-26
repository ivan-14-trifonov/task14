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
const NODE_MIN_HEIGHT = 56
const NODE_GAP = 26
const CENTER_SIZE = 128
const MAP_PADDING = 80
const OVERLAP_PASSES = 120

type MapNode = {
  id: string
  branch: Branch
  inProgressTasks: Task[]
  parentId: string | null
  depth: number
  height: number
  x: number
  y: number
}

type MapEdge = {
  fromId: string | null
  toId: string
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

function estimateNodeHeight(branch: Branch) {
  const visibleLength = branch.title.length + branch.tag.length + (branch.timing ? 12 : 0)
  const lines = Math.max(1, Math.ceil(visibleLength / 22))
  return Math.max(NODE_MIN_HEIGHT, lines * 22 + 24)
}

function getNodeRect(node: Pick<MapNode, "x" | "y" | "height">) {
  return {
    left: node.x - NODE_WIDTH / 2 - NODE_GAP,
    right: node.x + NODE_WIDTH / 2 + NODE_GAP,
    top: node.y - node.height / 2 - NODE_GAP,
    bottom: node.y + node.height / 2 + NODE_GAP,
  }
}

function pushNodeFromCenter(node: MapNode) {
  const rect = getNodeRect(node)
  const centerRect = {
    left: -CENTER_SIZE / 2 - NODE_GAP,
    right: CENTER_SIZE / 2 + NODE_GAP,
    top: -CENTER_SIZE / 2 - NODE_GAP,
    bottom: CENTER_SIZE / 2 + NODE_GAP,
  }
  const overlapX = Math.min(rect.right, centerRect.right) - Math.max(rect.left, centerRect.left)
  const overlapY = Math.min(rect.bottom, centerRect.bottom) - Math.max(rect.top, centerRect.top)

  if (overlapX <= 0 || overlapY <= 0) return false

  const length = Math.hypot(node.x, node.y) || 1
  node.x += (node.x / length) * Math.max(overlapX, 12)
  node.y += (node.y / length) * Math.max(overlapY, 12)
  return true
}

function pushNodesApart(first: MapNode, second: MapNode) {
  const firstRect = getNodeRect(first)
  const secondRect = getNodeRect(second)
  const overlapX = Math.min(firstRect.right, secondRect.right) - Math.max(firstRect.left, secondRect.left)
  const overlapY = Math.min(firstRect.bottom, secondRect.bottom) - Math.max(firstRect.top, secondRect.top)

  if (overlapX <= 0 || overlapY <= 0) return false

  const deltaX = second.x - first.x
  const deltaY = second.y - first.y

  if (overlapX < overlapY) {
    const push = overlapX / 2 + 1
    const direction = deltaX >= 0 ? 1 : -1
    first.x -= push * direction
    second.x += push * direction
  } else {
    const push = overlapY / 2 + 1
    const direction = deltaY >= 0 ? 1 : -1
    first.y -= push * direction
    second.y += push * direction
  }

  return true
}

function resolveNodeOverlaps(nodes: MapNode[]) {
  for (let pass = 0; pass < OVERLAP_PASSES; pass += 1) {
    let changed = false

    for (const node of nodes) {
      changed = pushNodeFromCenter(node) || changed
    }

    for (let index = 0; index < nodes.length; index += 1) {
      for (let nextIndex = index + 1; nextIndex < nodes.length; nextIndex += 1) {
        changed = pushNodesApart(nodes[index], nodes[nextIndex]) || changed
      }
    }

    if (!changed) break
  }
}

function buildMindMapLayout(data: AppData) {
  const roots = getChildren(data, null)
  const nodes: MapNode[] = []
  const edges: MapEdge[] = []

  function placeBranch(branch: Branch, angle: number, radius: number, spread: number, parentId: string | null) {
    const point = polarPoint(angle, radius)
    nodes.push({
      id: branch.id,
      branch,
      inProgressTasks: getBranchInProgressTasks(branch.id, data),
      parentId,
      depth: Math.round((radius - CENTER_RADIUS) / LEVEL_GAP),
      height: estimateNodeHeight(branch),
      x: point.x,
      y: point.y,
    })
    edges.push({ fromId: parentId, toId: branch.id })

    const children = getChildren(data, branch.id)
    if (!children.length) return

    const totalLeaves = children.reduce((total, child) => total + getBranchLeafCount(child, data), 0)
    let cursor = angle - spread / 2

    for (const child of children) {
      const childLeaves = getBranchLeafCount(child, data)
      const childSpread = (childLeaves / totalLeaves) * spread
      const childAngle = cursor + childSpread / 2
      placeBranch(child, childAngle, radius + LEVEL_GAP, Math.max(18, childSpread * 0.9), branch.id)
      cursor += childSpread
    }
  }

  const rootStep = 360 / roots.length
  roots.forEach((branch, index) => {
    const angle = -90 + index * rootStep
    placeBranch(branch, angle, CENTER_RADIUS, Math.min(120, rootStep * 0.82), null)
  })

  resolveNodeOverlaps(nodes)

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
  const roots = getChildren(data, null)

  if (!roots.length) {
    return <Card className="p-6 text-sm text-muted-foreground">Дерево пустое. Создайте первое направление.</Card>
  }

  const layout = buildMindMapLayout(data)
  const nodesById = new Map(layout.nodes.map((node) => [node.id, node]))

  return (
    <div className="overflow-auto rounded-lg border bg-white p-4">
      <div className="relative" style={{ width: layout.width, height: layout.height }}>
        <svg className="absolute inset-0" width={layout.width} height={layout.height} aria-hidden="true">
          {layout.edges.map((edge) => {
            const child = nodesById.get(edge.toId)
            const parent = edge.fromId ? nodesById.get(edge.fromId) : layout.center
            if (!child || !parent) return null

            return (
              <line
                key={`${edge.fromId ?? "root"}-${edge.toId}`}
                x1={parent.x}
                y1={parent.y}
                x2={child.x}
                y2={child.y}
                className="stroke-slate-200"
                strokeWidth="2"
              />
            )
          })}
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
            height={node.height}
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
  height,
  x,
  y,
}: {
  branch: Branch
  inProgressTasks: Task[]
  depth: number
  height: number
  x: number
  y: number
}) {
  return (
    <div className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y, width: NODE_WIDTH }}>
      <Link
        href={`/branches/${branch.id}`}
        style={{ minHeight: height }}
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
