import { getDescendantBranchIds } from "@/lib/data/tree"
import type { AppData, BranchTaskCounts } from "@/types"

export function getBranchTaskCounts(branchId: string, data: AppData): BranchTaskCounts {
  const branchIds = new Set(getDescendantBranchIds(branchId, data))
  return Object.values(data.tasks).reduce(
    (counts, task) => {
      if (!branchIds.has(task.branchId)) return counts
      if (task.status === "in_progress") counts.inProgress += 1
      if (task.status === "planned") counts.planned += 1
      if (task.status === "done") counts.done += 1
      return counts
    },
    { inProgress: 0, planned: 0, done: 0 },
  )
}
