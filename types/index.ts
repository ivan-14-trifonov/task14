export type BranchStatus = "in_progress" | "timing" | "paused" | null
export type TaskStatus =
  | "in_progress"
  | "planned"
  | "recurring"
  | "on_demand"
  | "period"
  | "today"
  | "calendar"
  | "uncontrolled"
  | "paused"
  | "done"
export type TaskDailyStatus = "worked" | "closed"
export type CalendarReminderKey = "week" | "three_days" | "day" | "same_day"

export type Branch = {
  id: string
  title: string
  tag: string
  regulation: string
  parentId: string | null
  status: BranchStatus
  timing: {
    startDate: string
    dailyMinutes: number
    entries: Record<string, number>
  } | null
  sort: number
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: string
  title: string
  description: string
  branchId: string
  status: TaskStatus
  sort: number
  createdAt: string
  updatedAt: string
  completedAt: string | null
  brainstorm: boolean
  dailyStatus: {
    date: string
    status: TaskDailyStatus
  } | null
  calendar: {
    at: string
    reminders: Record<
      CalendarReminderKey,
      {
        enabled: boolean
        sentAt: string | null
      }
    >
  } | null
}

export type AppData = {
  version: number
  branches: Record<string, Branch>
  tasks: Record<string, Task>
  meta: {
    createdAt: string
    updatedAt: string
  }
}

export type BranchTaskCounts = {
  inProgress: number
  recurring: number
  onDemand: number
  period: number
  today: number
  calendar: number
  uncontrolled: number
  brainstorm: number
  planned: number
  done: number
}
