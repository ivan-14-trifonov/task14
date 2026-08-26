import Link from "next/link"
import { getChildren } from "@/lib/data/tree"
import { BranchTag } from "@/components/branch-tag"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTitle } from "@/components/branch-title"
import { BranchStatusDot } from "@/components/status-badge"
import { Card } from "@/components/ui"
import { cn } from "@/lib/utils"
import type { AppData, Branch, Task } from "@/types"

const NODE_WIDTH = 220
const NODE_MIN_HEIGHT = 56
const HORIZONTAL_GAP = 96
const VERTICAL_GAP = 28
const ROOT_GAP = 48
const CENTER_SIZE = 128
const MAP_PADDING = 80

type Side = "left" | "right"

type BranchLayout = {
  branch: Branch
  children: BranchLayout[]
  height: number
  nodeHeight: number
  width: number
}

type MapNode = {
  id: string
  branch: Branch
  inProgressTasks: Task[]
  parentId: string | null
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

function getBranchInProgressTasks(branchId: string, data: AppData) {
  return Object.values(data.tasks)
    .filter((task) => task.branchId === branchId && task.status === "in_progress")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

function estimateNodeHeight(branch: Branch) {
  const visibleLength = branch.title.length + branch.tag.length + (branch.timing ? 18 : 0)
  const lines = Math.max(1, Math.ceil(visibleLength / 14))
  return Math.max(NODE_MIN_HEIGHT, lines * 24 + 28)
}

function getStackHeight(items: BranchLayout[], gap: number) {
  if (!items.length) return 0
  return items.reduce((total, item) => total + item.height, 0) + gap * (items.length - 1)
}

function buildBranchLayout(branch: Branch, data: AppData): BranchLayout {
  const children = getChildren(data, branch.id).map((child) => buildBranchLayout(child, data))
  const nodeHeight = estimateNodeHeight(branch)
  const childrenHeight = getStackHeight(children, VERTICAL_GAP)
  const childrenWidth = children.length ? Math.max(...children.map((child) => child.width)) : 0

  return {
    branch,
    children,
    height: Math.max(nodeHeight, childrenHeight),
    nodeHeight,
    width: NODE_WIDTH + (children.length ? HORIZONTAL_GAP + childrenWidth : 0),
  }
}

function placeBranchLayout({
  layout,
  data,
  depth,
  edges,
  nodes,
  parentId,
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
  side: Side
  x: number
  y: number
}) {
  nodes.push({
    id: layout.branch.id,
    branch: layout.branch,
    inProgressTasks: getBranchInProgressTasks(layout.branch.id, data),
    parentId,
    depth,
    side,
    height: layout.nodeHeight,
    x,
    y,
  })
  edges.push({ fromId: parentId, toId: layout.branch.id })

  if (!layout.children.length) return

  const childrenHeight = getStackHeight(layout.children, VERTICAL_GAP)
  let cursor = y - childrenHeight / 2

  for (const child of layout.children) {
    const childY = cursor + child.height / 2
    placeBranchLayout({
      layout: child,
      data,
      depth: depth + 1,
      edges,
      nodes,
      parentId: layout.branch.id,
      side,
      x: x + (side === "right" ? 1 : -1) * (NODE_WIDTH + HORIZONTAL_GAP),
      y: childY,
    })
    cursor += child.height + VERTICAL_GAP
  }
}

function placeRootLayouts({
  data,
  edges,
  layouts,
  nodes,
  side,
}: {
  data: AppData
  edges: MapEdge[]
  layouts: BranchLayout[]
  nodes: MapNode[]
  side: Side
}) {
  const rootsHeight = getStackHeight(layouts, ROOT_GAP)
  let cursor = -rootsHeight / 2
  const direction = side === "right" ? 1 : -1
  const x = direction * (CENTER_SIZE / 2 + HORIZONTAL_GAP + NODE_WIDTH / 2)

  for (const layout of layouts) {
    const y = cursor + layout.height / 2
    placeBranchLayout({ layout, data, depth: 0, edges, nodes, parentId: null, side, x, y })
    cursor += layout.height + ROOT_GAP
  }
}

function buildMindMapLayout(data: AppData) {
  const rootLayouts = getChildren(data, null).map((branch) => buildBranchLayout(branch, data))
  const rightRootCount = Math.ceil(rootLayouts.length / 2)
  const rightRoots = rootLayouts.slice(0, rightRootCount)
  const leftRoots = rootLayouts.slice(rightRootCount)
  const nodes: MapNode[] = []
  const edges: MapEdge[] = []

  placeRootLayouts({ data, edges, layouts: rightRoots, nodes, side: "right" })
  placeRootLayouts({ data, edges, layouts: leftRoots, nodes, side: "left" })

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
        <BranchTitle branch={branch} className="min-w-0 break-words" />
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
