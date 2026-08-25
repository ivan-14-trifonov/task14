import Link from "next/link"
import { getChildren } from "@/lib/data/tree"
import { BranchTag } from "@/components/branch-tag"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTitle } from "@/components/branch-title"
import { BranchStatusDot } from "@/components/status-badge"
import { Card } from "@/components/ui"
import { cn } from "@/lib/utils"
import type { AppData, Branch, Task } from "@/types"

function getBranchInProgressTasks(branchId: string, data: AppData) {
  return Object.values(data.tasks)
    .filter((task) => task.branchId === branchId && task.status === "in_progress")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

export function MindMap({ data }: { data: AppData }) {
  const roots = getChildren(data, null)

  if (!roots.length) {
    return <Card className="p-6 text-sm text-muted-foreground">Дерево пустое. Создайте первое направление.</Card>
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white p-4">
      <div className="flex min-w-max items-start gap-8 py-2">
        {roots.map((branch) => (
          <MindMapNode key={branch.id} branch={branch} data={data} depth={0} />
        ))}
      </div>
    </div>
  )
}

function MindMapNode({ branch, data, depth }: { branch: Branch; data: AppData; depth: number }) {
  const children = getChildren(data, branch.id)
  const inProgressTasks = getBranchInProgressTasks(branch.id, data)

  return (
    <div className="flex flex-col items-center">
      <BranchBubble branch={branch} inProgressTasks={inProgressTasks} depth={depth} />
      {children.length ? (
        <div className="mt-3 flex flex-col items-center">
          <div className="h-5 border-l" />
          <div className="relative flex items-start gap-6 pt-5">
            <div className="absolute left-0 right-0 top-0 border-t" />
            {children.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="absolute -top-5 h-5 border-l" />
                <MindMapNode branch={child} data={data} depth={depth + 1} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function BranchBubble({
  branch,
  inProgressTasks,
  depth,
}: {
  branch: Branch
  inProgressTasks: Task[]
  depth: number
}) {
  return (
    <div className="group relative">
      <Link
        href={`/branches/${branch.id}`}
        className={cn(
          "flex max-w-64 items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold shadow-sm transition hover:border-blue-200 hover:bg-blue-50",
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
