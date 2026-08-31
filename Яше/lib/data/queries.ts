import { readData } from "@/lib/data/storage"
import { getDescendantBranchIds } from "@/lib/data/tree"
import type { TaskStatus } from "@/types"

type TaskFilters = {
  query?: string
  status?: TaskStatus | "all"
  branchId?: string | "all"
  includeDescendants?: boolean
}

export async function getDataForPage() {
  return readData()
}

export function getFilteredTasks(data: Awaited<ReturnType<typeof readData>>, filters: TaskFilters) {
  const search = filters.query?.trim().toLowerCase()
  const branchIds =
    filters.branchId && filters.branchId !== "all"
      ? new Set(filters.includeDescendants ? getDescendantBranchIds(filters.branchId, data) : [filters.branchId])
      : null

  return Object.values(data.tasks)
    .filter((task) => {
      if (filters.status && filters.status !== "all" && task.status !== filters.status) return false
      if (branchIds && !branchIds.has(task.branchId)) return false
      if (!search) return true
      return `${task.title} ${task.description}`.toLowerCase().includes(search)
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}
