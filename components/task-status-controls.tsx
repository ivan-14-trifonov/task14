import { setTaskStatusAction } from "@/lib/data/actions"
import { cn } from "@/lib/utils"
import type { Task, TaskStatus } from "@/types"

const quickStatuses: Array<{
  status: Exclude<TaskStatus, "paused">
  label: string
  className: string
}> = [
  { status: "in_progress", label: "В работе", className: "bg-red-600 text-white" },
  { status: "recurring", label: "Повторяющаяся задача", className: "border border-blue-600 bg-transparent text-blue-700" },
  { status: "on_demand", label: "Задача по требованию", className: "bg-yellow-500 text-white" },
  { status: "period", label: "Задача периода", className: "bg-purple-600 text-white" },
]

export function TaskStatusControls({ task }: { task: Task }) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-label="Быстрое изменение статуса">
      {quickStatuses.map((item) => {
        const active = task.status === item.status

        return (
          <form key={item.status} action={setTaskStatusAction}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="status" value={item.status} />
            <button
              type="submit"
              disabled={active}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "inline-flex size-5 items-center justify-center rounded-full text-[10px] font-bold leading-none transition hover:scale-110 disabled:scale-100",
                item.className,
                active ? "ring-2 ring-slate-900 ring-offset-2" : "opacity-75 hover:opacity-100",
              )}
            />
          </form>
        )
      })}
    </div>
  )
}
