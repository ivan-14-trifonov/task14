import { NextResponse } from "next/server"
import { readData, writeData } from "@/lib/data/storage"
import { getBranchPath } from "@/lib/data/tree"
import { formatCalendarDate } from "@/lib/utils"
import type { AppData, CalendarReminderKey, Task } from "@/types"

export const dynamic = "force-dynamic"

const REMINDER_OFFSETS_DAYS: Record<CalendarReminderKey, number> = {
  week: 7,
  three_days: 3,
  day: 1,
}

const REMINDER_LABELS: Record<CalendarReminderKey, string> = {
  week: "за неделю",
  three_days: "за 3 дня",
  day: "за 1 день",
}
const DAY_MS = 24 * 60 * 60 * 1000

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

function getMoscowDateKey(value = new Date()) {
  return new Intl.DateTimeFormat("sv-SE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Europe/Moscow",
  }).format(value)
}

function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number)
  const timestamp = Date.UTC(year, month - 1, day) + days * DAY_MS
  return new Date(timestamp).toISOString().slice(0, 10)
}

function getDueReminderKeys(task: Task, today: string) {
  if (task.status !== "calendar" || !task.calendar) return []
  const eventDate = task.calendar.at
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || today >= eventDate) return []

  return (Object.keys(REMINDER_OFFSETS_DAYS) as CalendarReminderKey[]).filter((key) => {
    const reminder = task.calendar?.reminders[key]
    if (!reminder?.enabled || reminder.sentAt) return false
    return addDays(eventDate, -REMINDER_OFFSETS_DAYS[key]) === today
  })
}

function buildMessage(task: Task, key: CalendarReminderKey, data: AppData) {
  const path = getBranchPath(task.branchId, data).map((branch) => branch.title).join(" / ")
  return [
    `Напоминание ${REMINDER_LABELS[key]}`,
    "",
    task.title,
    `Когда: ${formatCalendarDate(task.calendar?.at ?? "")}`,
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
  const today = getMoscowDateKey()
  const sentAt = new Date().toISOString()
  const tasks = { ...data.tasks }
  let sent = 0

  for (const task of Object.values(data.tasks)) {
    const dueKeys = getDueReminderKeys(task, today)
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
