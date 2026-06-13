import type { Task, TaskDailyStatus } from "@/types"

const DAILY_TIME_ZONE = "Europe/Moscow"

export function getTodayKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DAILY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

export function getTaskDailyState(task: Task, today = getTodayKey()): TaskDailyStatus | "pending" | null {
  if (task.status !== "in_progress") return null
  if (task.dailyStatus?.date !== today) return "pending"
  return task.dailyStatus.status
}
