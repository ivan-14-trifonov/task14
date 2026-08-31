import { CheckCircle2, RotateCcw, Pencil } from "lucide-react"
import { completeTaskAction, deleteTaskAction, restoreTaskAction } from "@/lib/data/actions"
import { formatDate } from "@/lib/utils"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DialogButton } from "@/components/dialog-button"
import { StatusBadge } from "@/components/status-badge"
import { Button, Card } from "@/components/ui"
import { TaskDailyControls } from "@/components/task-daily-controls"
import { TaskForm } from "@/components/task-form"
import { TaskStatusControls } from "@/components/task-status-controls"
import type { AppData, Task } from "@/types"

export function TaskList({ data, tasks, archive = false }: { data: AppData; tasks: Task[]; archive?: boolean }) {
  if (!tasks.length) {
    return <Card className="p-6 text-sm text-muted-foreground">{archive ? "Архив пуст." : "Активных задач пока нет."}</Card>
  }

  return (
    <div className="grid gap-3">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{task.title}</h3>
                <StatusBadge status={task.status} />
              </div>
              <TaskStatusControls task={task} />
              {task.description ? <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{task.description}</p> : null}
              {!archive ? <TaskDailyControls task={task} /> : null}
              <p className="mt-3 text-xs text-muted-foreground">
                {data.branches[task.branchId]?.title ?? "Ветка удалена"} · обновлено {formatDate(task.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DialogButton
                title="Редактировать задачу"
                label={
                  <>
                    <Pencil className="size-4" />
                    Изменить
                  </>
                }
                variant="ghost"
              >
                <TaskForm data={data} task={task} />
              </DialogButton>
              {archive ? (
                <form action={restoreTaskAction}>
                  <input type="hidden" name="id" value={task.id} />
                  <Button type="submit" variant="ghost">
                    <RotateCcw className="size-4" />
                    Восстановить
                  </Button>
                </form>
              ) : (
                <form action={completeTaskAction}>
                  <input type="hidden" name="id" value={task.id} />
                  <Button type="submit" variant="ghost">
                    <CheckCircle2 className="size-4" />
                    Готово
                  </Button>
                </form>
              )}
              <ConfirmDialog
                id={task.id}
                action={deleteTaskAction}
                title="Подтвердить удаление"
                text="Задача будет удалена окончательно."
              />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
