import { getTodayKey } from "@/lib/data/daily"
import type { Branch } from "@/types"

function parseDateKey(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  return Date.UTC(year, month - 1, day)
}

function formatDateKey(timestamp: number) {
  return new Date(timestamp).toISOString().slice(0, 10)
}

function addDays(value: string, days: number) {
  return formatDateKey(parseDateKey(value) + days * 24 * 60 * 60 * 1000)
}

function diffDays(from: string, to: string) {
  return Math.round((parseDateKey(to) - parseDateKey(from)) / (24 * 60 * 60 * 1000))
}

export function getBranchTimingStats(branch: Branch, today = getTodayKey()) {
  if (!branch.timing) return null
  if (branch.timing.dailyMinutes <= 0) return null

  const daysSinceStart = diffDays(branch.timing.startDate, today)
  if (daysSinceStart < 0) {
    return {
      dailyMinutes: branch.timing.dailyMinutes,
      averageMinutes: 0,
      percent: 0,
      days: 0,
      todayMinutes: 0,
    }
  }

  const days = Math.min(daysSinceStart + 1, 21)
  const firstDay = addDays(today, -(days - 1))
  let total = 0

  for (let index = 0; index < days; index += 1) {
    const date = addDays(firstDay, index)
    total += branch.timing.entries[date] ?? 0
  }

  const averageMinutes = total / days

  return {
    dailyMinutes: branch.timing.dailyMinutes,
    averageMinutes,
    percent: Math.round((averageMinutes / branch.timing.dailyMinutes) * 100),
    days,
    todayMinutes: branch.timing.entries[today] ?? 0,
  }
}
