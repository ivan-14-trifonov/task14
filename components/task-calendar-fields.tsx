"use client"

import { useMemo, useState } from "react"
import { Input, Label, Select } from "@/components/ui"
import type { Task, TaskStatus } from "@/types"

function toLocalInputValue(value?: string | null) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return offsetDate.toISOString().slice(0, 16)
}

function toIsoValue(value: string) {
  if (!value) return ""
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString()
}

export function TaskCalendarFields({ task }: { task?: Task }) {
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "planned")
  const [calendarAtLocal, setCalendarAtLocal] = useState(() => toLocalInputValue(task?.calendar?.at))
  const calendarAt = useMemo(() => toIsoValue(calendarAtLocal), [calendarAtLocal])
  const reminders = task?.calendar?.reminders

  return (
    <>
      <Label>
        Статус
        <Select
          name="status"
          required
          value={status}
          onChange={(event) => setStatus(event.target.value as TaskStatus)}
        >
          {task?.status === "paused" ? <option value="paused">На паузе</option> : null}
          <option value="in_progress">В работе</option>
          <option value="planned">В плане</option>
          <option value="recurring">Повторяющаяся задача</option>
          <option value="on_demand">Задача по требованию</option>
          <option value="period">Задача периода</option>
          <option value="calendar">Календарь</option>
          <option value="done">Выполнено</option>
        </Select>
      </Label>

      {status === "calendar" ? (
        <div className="grid gap-3 rounded-md border bg-muted/30 p-3">
          <input type="hidden" name="calendarAt" value={calendarAt} />
          <Label>
            Дата и время
            <Input
              type="datetime-local"
              required
              value={calendarAtLocal}
              onChange={(event) => setCalendarAtLocal(event.target.value)}
            />
          </Label>
          <div className="grid gap-2 text-sm">
            <span className="font-medium">Напоминания</span>
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" name="reminderWeek" defaultChecked={reminders?.week.enabled ?? true} />
              За неделю
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" name="reminderThreeDays" defaultChecked={reminders?.three_days.enabled ?? true} />
              За 3 дня
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" name="reminderDay" defaultChecked={reminders?.day.enabled ?? true} />
              За 1 день
            </label>
            <label className="flex items-center gap-2 text-muted-foreground">
              <input type="checkbox" name="reminderHour" defaultChecked={reminders?.hour.enabled ?? true} />
              За 1 час
            </label>
          </div>
        </div>
      ) : null}
    </>
  )
}
