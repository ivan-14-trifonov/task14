import { Save } from "lucide-react"
import { createTaskAction, updateTaskAction } from "@/lib/data/actions"
import { AutoCloseForm } from "@/components/auto-close-form"
import { BranchLevelSelect } from "@/components/branch-level-select"
import { TaskCalendarFields } from "@/components/task-calendar-fields"
import { Button, Input, Label, Textarea } from "@/components/ui"
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
    <AutoCloseForm action={action} className="grid gap-4">
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
      <TaskCalendarFields task={task} />
      <Button type="submit">
        <Save className="size-4" />
        Сохранить
      </Button>
    </AutoCloseForm>
  )
}
