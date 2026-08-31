export type BranchStatus = "in_progress" | "timing" | "paused" | null
export type TaskStatus = "in_progress" | "planned" | "recurring" | "on_demand" | "period" | "paused" | "done"
export type TaskDailyStatus = "worked" | "closed"

export type Branch = {
  id: string
  title: string
  tag: string
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
  dailyStatus: {
    date: string
    status: TaskDailyStatus
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
  planned: number
  done: number
}
