import { NextResponse } from "next/server"
import { readData, writeData } from "@/lib/data/storage"
import { getBranchPath } from "@/lib/data/tree"
import type { AppData, CalendarReminderKey, Task } from "@/types"

export const dynamic = "force-dynamic"

const REMINDER_OFFSETS: Record<CalendarReminderKey, number> = {
  week: 7 * 24 * 60 * 60 * 1000,
  three_days: 3 * 24 * 60 * 60 * 1000,
  day: 24 * 60 * 60 * 1000,
  hour: 60 * 60 * 1000,
}

const REMINDER_LABELS: Record<CalendarReminderKey, string> = {
  week: "за неделю",
  three_days: "за 3 дня",
  day: "за 1 день",
  hour: "за 1 час",
}
const DUE_WINDOW_MS = 30 * 60 * 1000

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Moscow",
  }).format(new Date(value))
}

function getDueReminderKeys(task: Task, now: number) {
  if (task.status !== "calendar" || !task.calendar) return []
  const eventTime = new Date(task.calendar.at).getTime()
  if (Number.isNaN(eventTime) || now >= eventTime) return []

  return (Object.keys(REMINDER_OFFSETS) as CalendarReminderKey[]).filter((key) => {
    const reminder = task.calendar?.reminders[key]
    if (!reminder?.enabled || reminder.sentAt) return false
    const dueAt = eventTime - REMINDER_OFFSETS[key]
    return now >= dueAt && now < dueAt + DUE_WINDOW_MS
  })
}

function buildMessage(task: Task, key: CalendarReminderKey, data: AppData) {
  const path = getBranchPath(task.branchId, data).map((branch) => branch.title).join(" / ")
  return [
    `Напоминание ${REMINDER_LABELS[key]}`,
    "",
    task.title,
    `Когда: ${formatDateTime(task.calendar?.at ?? "")}`,
    path ? `Ветка: ${path}` : null,
    task.description ? `\n${task.description}` : null,
  ]
    .filter(Boolean)
    .join("\n")
}

async function sendTelegramMessage(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) throw new Error("Telegram env vars are missing")

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  })

  if (!response.ok) {
    throw new Error("Telegram request failed")
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const data = await readData()
  const now = Date.now()
  const sentAt = new Date(now).toISOString()
  const tasks = { ...data.tasks }
  let sent = 0

  for (const task of Object.values(data.tasks)) {
    const dueKeys = getDueReminderKeys(task, now)
    if (!dueKeys.length || !task.calendar) continue

    let updatedTask = task
    for (const key of dueKeys) {
      await sendTelegramMessage(buildMessage(task, key, data))
      updatedTask = {
        ...updatedTask,
        calendar: {
          ...updatedTask.calendar!,
          reminders: {
            ...updatedTask.calendar!.reminders,
            [key]: {
              ...updatedTask.calendar!.reminders[key],
              sentAt,
            },
          },
        },
      }
      sent += 1
    }
    tasks[task.id] = updatedTask
  }

  if (sent > 0) {
    await writeData({ ...data, tasks })
  }

  return NextResponse.json({ ok: true, sent })
}
