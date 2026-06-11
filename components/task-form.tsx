import { Save } from "lucide-react"
import { createTaskAction, updateTaskAction } from "@/lib/data/actions"
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
  const branches = Object.values(data.branches).sort((a, b) => a.title.localeCompare(b.title, "ru"))
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
      <Label>
        Ветка
        <Select name="branchId" required defaultValue={task?.branchId ?? defaultBranchId ?? ""}>
          <option value="" disabled>
            Выберите ветку
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.title}
            </option>
          ))}
        </Select>
      </Label>
      <Label>
        Статус
        <Select name="status" required defaultValue={task?.status ?? "planned"}>
          <option value="in_progress">В работе</option>
          <option value="planned">В плане</option>
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
