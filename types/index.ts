export type BranchStatus = "in_progress" | null
export type TaskStatus = "in_progress" | "planned" | "done"

export type Branch = {
  id: string
  title: string
  parentId: string | null
  status: BranchStatus
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
  planned: number
  done: number
}
