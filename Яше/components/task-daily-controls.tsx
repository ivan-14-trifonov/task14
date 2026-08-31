import { Circle, CircleCheck, Clock3 } from "lucide-react"
import { closeTaskForTodayAction, markTaskWorkedTodayAction } from "@/lib/data/actions"
import { getTaskDailyState } from "@/lib/data/daily"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui"
import type { Task } from "@/types"

export function TaskDailyControls({ task }: { task: Task }) {
  const state = getTaskDailyState(task)
  if (!state) return null

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium ring-1",
          state === "pending" && "bg-red-50 text-red-700 ring-red-200",
          state === "worked" && "bg-yellow-50 text-yellow-700 ring-yellow-200",
          state === "closed" && "bg-emerald-50 text-emerald-700 ring-emerald-200",
        )}
      >
        {state === "pending" ? <Circle className="size-4" /> : null}
        {state === "worked" ? <Clock3 className="size-4" /> : null}
        {state === "closed" ? <CircleCheck className="size-4" /> : null}
        {state === "pending" ? "Сегодня в работе" : null}
        {state === "worked" ? "Поработал сегодня" : null}
        {state === "closed" ? "Закрыто на сегодня" : null}
      </span>

      {state !== "worked" ? (
        <form action={markTaskWorkedTodayAction}>
          <input type="hidden" name="id" value={task.id} />
          <Button type="submit" variant="secondary" className="border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100">
            Поработал
          </Button>
        </form>
      ) : null}

      {state !== "closed" ? (
        <form action={closeTaskForTodayAction}>
          <input type="hidden" name="id" value={task.id} />
          <Button type="submit" variant="secondary" className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
            Закрыл на сегодня
          </Button>
        </form>
      ) : null}
    </div>
  )
}
