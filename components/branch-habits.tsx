import { Plus, Sprout } from "lucide-react"
import { AutoCloseForm } from "@/components/auto-close-form"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DialogButton } from "@/components/dialog-button"
import { Button, Card, Input, Label, Textarea } from "@/components/ui"
import { createHabitAction, deleteHabitAction, setHabitStatusAction, updateHabitAction } from "@/lib/data/actions"
import { habitStatusLabels } from "@/lib/data/habits"
import type { Habit } from "@/types"

function HabitForm({ branchId, habit }: { branchId: string; habit?: Habit }) {
  const action = habit
    ? updateHabitAction.bind(null, branchId, habit.id)
    : createHabitAction.bind(null, branchId)

  return (
    <AutoCloseForm action={action} className="grid gap-4">
      <Label>
        Название
        <Input name="title" defaultValue={habit?.title} required pattern=".*\S.*" />
      </Label>
      <Label>
        Комментарий (необязательно)
        <Textarea name="comment" defaultValue={habit?.comment} />
      </Label>
      <Button type="submit">Сохранить</Button>
    </AutoCloseForm>
  )
}

function HabitRow({ habit }: { habit: Habit }) {
  const statusAction = setHabitStatusAction.bind(null, habit.branchId, habit.id)

  return (
    <li className="grid gap-2 rounded-md border p-3 sm:flex sm:items-start sm:justify-between">
      <div className="min-w-0">
        <p className="break-words font-medium">{habit.title}</p>
        {habit.comment ? (
          <p className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{habit.comment}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <form action={statusAction} className="flex flex-wrap gap-1">
          {habit.status === "in_progress" ? (
            <>
              <Button type="submit" variant="secondary" name="status" value="formed" title="Легче сделать, чем не сделать">
                Сформирована
              </Button>
              <Button type="submit" variant="ghost" name="status" value="planned">Вернуть в план</Button>
            </>
          ) : (
            <Button type="submit" variant="secondary" name="status" value="in_progress">
              {habit.status === "formed" ? "Вернуть в работу" : "Взять в работу"}
            </Button>
          )}
        </form>
        <DialogButton title="Редактировать привычку" label="Изменить" variant="ghost">
          <HabitForm branchId={habit.branchId} habit={habit} />
        </DialogButton>
        <ConfirmDialog
          id={habit.id}
          action={deleteHabitAction}
          title="Удалить привычку?"
          text={habit.title}
        />
      </div>
    </li>
  )
}

export function BranchHabits({ branchId, habits }: { branchId: string; habits: Habit[] }) {
  const inProgress = habits.filter((habit) => habit.status === "in_progress")
  const planned = habits.filter((habit) => habit.status === "planned")
  const formed = habits.filter((habit) => habit.status === "formed")

  return (
    <Card id="habits" className="grid gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Sprout className="size-5 text-emerald-700" aria-hidden="true" />
          Привычки
        </h2>
        <DialogButton title="Новая привычка" label={<><Plus className="size-4" /> Добавить привычку</>}>
          <HabitForm branchId={branchId} />
        </DialogButton>
      </div>
      {habits.length ? (
        <>
          <div className="grid gap-2">
            <h3 className="text-sm font-semibold">{habitStatusLabels.in_progress}</h3>
            {inProgress.length ? (
              <ul className="grid gap-2">{inProgress.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</ul>
            ) : <p className="text-sm text-muted-foreground">Нет привычек в работе.</p>}
          </div>
          {planned.length ? (
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold">{habitStatusLabels.planned}</h3>
              <ul className="grid gap-2">{planned.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</ul>
            </div>
          ) : null}
          {formed.length ? (
            <details>
              <summary className="w-fit cursor-pointer text-sm font-semibold">Сформированы ({formed.length})</summary>
              <p className="my-2 text-sm text-muted-foreground">Легче сделать, чем не сделать.</p>
              <ul className="grid gap-2">{formed.map((habit) => <HabitRow key={habit.id} habit={habit} />)}</ul>
            </details>
          ) : null}
        </>
      ) : <p className="text-sm text-muted-foreground">В этом направлении пока нет привычек.</p>}
    </Card>
  )
}
