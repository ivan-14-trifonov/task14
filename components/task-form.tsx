import { Save } from "lucide-react"
import { createTaskAction, updateTaskAction } from "@/lib/data/actions"
import { BranchLevelSelect } from "@/components/branch-level-select"
import { Button, Input, Label, Select, Textarea } from "@/components/ui"
import type { AppData, Task } from "@/types"

export function TaskForm({
  data,
  task,
  defaultBranchId,
}: {
  data: AppData
  task?: Task
  defaultBranchId?: string
}) {
  const action = task ? updateTaskAction : createTaskAction

  return (
    <form action={action} className="grid gap-4">
      {task ? <input type="hidden" name="id" value={task.id} /> : null}
      <Label>
        Название
        <Input name="title" required defaultValue={task?.title ?? ""} />
      </Label>
      <Label>
        Описание
        <Textarea name="description" defaultValue={task?.description ?? ""} />
      </Label>
      <BranchLevelSelect data={data} name="branchId" label="Ветка" defaultValue={task?.branchId ?? defaultBranchId ?? ""} />
      <Label>
        Статус
        <Select name="status" required defaultValue={task?.status ?? "planned"}>
          {task?.status === "paused" ? <option value="paused">На паузе</option> : null}
          <option value="in_progress">В работе</option>
          <option value="planned">В плане</option>
          <option value="recurring">Повторяющаяся задача</option>
          <option value="on_demand">Задача по требованию</option>
          <option value="period">Задача периода</option>
          <option value="done">Выполнено</option>
        </Select>
      </Label>
      <Button type="submit">
        <Save className="size-4" />
        Сохранить
      </Button>
    </form>
  )
}
