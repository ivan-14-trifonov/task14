import { cn } from "@/lib/utils"
import type { BranchStatus, TaskStatus } from "@/types"

const taskLabels: Record<TaskStatus, string> = {
  in_progress: "В работе",
  planned: "В плане",
  paused: "На паузе",
  done: "Выполнено",
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        status === "in_progress" && "bg-red-50 text-red-700 ring-1 ring-red-200",
        status === "planned" && "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
        status === "paused" && "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200",
        status === "done" && "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
      )}
    >
      {taskLabels[status]}
    </span>
  )
}

export function BranchStatusDot({ status }: { status: BranchStatus }) {
  if (status !== "in_progress") return null
  return <span className="inline-block size-2 rounded-full bg-red-500" title="В работе" />
}
