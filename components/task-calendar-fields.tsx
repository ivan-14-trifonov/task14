"use client"

import { useState } from "react"
import { Input, Label, Select } from "@/components/ui"
import type { Task, TaskStatus } from "@/types"

function toDateInputValue(value?: string | null) {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(date)
}

export function TaskCalendarFields({ task }: { task?: Task }) {
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "planned")
  const [calendarAt, setCalendarAt] = useState(() => toDateInputValue(task?.calendar?.at))
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
          <option value="today">Сегодня</option>
          <option value="calendar">Календарь</option>
          <option value="uncontrolled">Не контролирую</option>
          <option value="done">Выполнено</option>
        </Select>
      </Label>

      {status === "calendar" ? (
        <div className="grid gap-3 rounded-md border bg-muted/30 p-3">
          <input type="hidden" name="calendarAt" value={calendarAt} />
          <Label>
            Дата
            <Input
              type="date"
              required
              value={calendarAt}
              onChange={(event) => setCalendarAt(event.target.value)}
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
          </div>
        </div>
      ) : null}
    </>
  )
}
