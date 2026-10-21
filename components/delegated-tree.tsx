import Link from "next/link"
import { Folder } from "lucide-react"
import { BranchTag } from "@/components/branch-tag"
import { BranchTitle } from "@/components/branch-title"
import { DelegatedIcon } from "@/components/delegated-icon"
import { Card } from "@/components/ui"
import { getChildren } from "@/lib/data/tree"
import type { AppData, Branch, Task } from "@/types"

export function DelegatedTree({ data }: { data: AppData }) {
  const delegatedTasks = Object.values(data.tasks)
    .filter((task) => task.status === "delegated")
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))

  if (!delegatedTasks.length) {
    return <Card className="p-6 text-sm text-muted-foreground">Делегированных задач пока нет.</Card>
  }

  const relevantBranchIds = new Set<string>()
  const tasksByBranch = new Map<string, Task[]>()
  const countsByBranch = new Map<string, number>()

  for (const task of delegatedTasks) {
    const branchTasks = tasksByBranch.get(task.branchId) ?? []
    branchTasks.push(task)
    tasksByBranch.set(task.branchId, branchTasks)

    let branch: Branch | undefined = data.branches[task.branchId]
    while (branch) {
      relevantBranchIds.add(branch.id)
      countsByBranch.set(branch.id, (countsByBranch.get(branch.id) ?? 0) + 1)
      branch = branch.parentId ? data.branches[branch.parentId] : undefined
    }
  }

  const roots = getChildren(data, null).filter((branch) => relevantBranchIds.has(branch.id))

  return (
    <div className="grid gap-4">
      {roots.map((branch) => (
        <DelegatedBranchNode
          key={branch.id}
          branch={branch}
          countsByBranch={countsByBranch}
          data={data}
          relevantBranchIds={relevantBranchIds}
          tasksByBranch={tasksByBranch}
          root
        />
      ))}
    </div>
  )
}

function DelegatedBranchNode({
  branch,
  countsByBranch,
  data,
  relevantBranchIds,
  tasksByBranch,
  root = false,
}: {
  branch: Branch
  countsByBranch: Map<string, number>
  data: AppData
  relevantBranchIds: Set<string>
  tasksByBranch: Map<string, Task[]>
  root?: boolean
}) {
  const children = getChildren(data, branch.id).filter((child) => relevantBranchIds.has(child.id))
  const tasks = tasksByBranch.get(branch.id) ?? []

  return (
    <div className={root ? "rounded-lg border bg-white p-4 shadow-sm" : "ml-3 border-l pl-4 pt-3"}>
      <div className="flex min-w-0 items-center gap-2">
        <Folder className="size-4 shrink-0 text-indigo-500" />
        <Link href={`/branches/${branch.id}`} className="min-w-0 font-semibold hover:text-indigo-700 hover:underline">
          <BranchTitle branch={branch} />
        </Link>
        <BranchTag tag={branch.tag} />
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-indigo-50 px-1.5 text-[10px] font-bold leading-4 text-indigo-700 ring-1 ring-indigo-200"
          title="Делегированные задачи во всей ветке"
        >
          <DelegatedIcon className="size-3" />
          {countsByBranch.get(branch.id) ?? 0}
        </span>
      </div>

      {tasks.length ? (
        <ul className="mt-2 grid gap-1.5 pl-6">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link
                href={`/branches/${branch.id}#task-${task.id}`}
                className="flex w-fit min-w-0 items-start gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-indigo-50 hover:text-indigo-800"
              >
                <DelegatedIcon className="mt-0.5 size-4" />
                <span className="min-w-0 break-words">{task.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      {children.map((child) => (
        <DelegatedBranchNode
          key={child.id}
          branch={child}
          countsByBranch={countsByBranch}
          data={data}
          relevantBranchIds={relevantBranchIds}
          tasksByBranch={tasksByBranch}
        />
      ))}
    </div>
  )
}
