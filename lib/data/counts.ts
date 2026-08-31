import { getDescendantBranchIds } from "@/lib/data/tree"
import type { AppData, BranchTaskCounts } from "@/types"

function sortCountTasks(data: AppData, branchIds: Set<string>) {
  return Object.values(data.tasks)
    .filter(
      (task) =>
        branchIds.has(task.branchId) &&
        (task.status === "in_progress" || task.status === "recurring" || task.status === "on_demand"),
    )
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

export function getBranchTaskCounts(branchId: string, data: AppData): BranchTaskCounts {
  const branchIds = new Set(getDescendantBranchIds(branchId, data))
  return Object.values(data.tasks).reduce(
    (counts, task) => {
      if (!branchIds.has(task.branchId)) return counts
      if (task.status === "in_progress") counts.inProgress += 1
      if (task.status === "recurring") counts.recurring += 1
      if (task.status === "on_demand") counts.onDemand += 1
      if (task.status === "planned") counts.planned += 1
      if (task.status === "done") counts.done += 1
      return counts
    },
    { inProgress: 0, recurring: 0, onDemand: 0, planned: 0, done: 0 },
  )
}

export function getDirectBranchTaskCounts(branchId: string, data: AppData): BranchTaskCounts {
  return Object.values(data.tasks).reduce(
    (counts, task) => {
      if (task.branchId !== branchId) return counts
      if (task.status === "in_progress") counts.inProgress += 1
      if (task.status === "recurring") counts.recurring += 1
      if (task.status === "on_demand") counts.onDemand += 1
      if (task.status === "planned") counts.planned += 1
      if (task.status === "done") counts.done += 1
      return counts
    },
    { inProgress: 0, recurring: 0, onDemand: 0, planned: 0, done: 0 },
  )
}

export function getBranchCountTasks(branchId: string, data: AppData) {
  return sortCountTasks(data, new Set(getDescendantBranchIds(branchId, data)))
}

export function getDirectBranchCountTasks(branchId: string, data: AppData) {
  return sortCountTasks(data, new Set([branchId]))
}
