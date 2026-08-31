import type { AppData, Branch } from "@/types"

export function getChildren(data: AppData, parentId: string | null) {
  return Object.values(data.branches)
    .filter((branch) => branch.parentId === parentId)
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

export function getBranchPath(branchId: string, data: AppData) {
  const path: Branch[] = []
  let current: Branch | undefined = data.branches[branchId]

  while (current) {
    path.unshift(current)
    current = current.parentId ? data.branches[current.parentId] : undefined
  }

  return path
}

export function getDescendantBranchIds(branchId: string, data: AppData): string[] {
  const ids = [branchId]
  const queue = [branchId]

  while (queue.length) {
    const current = queue.shift()
    if (!current) continue
    for (const branch of Object.values(data.branches)) {
      if (branch.parentId === current) {
        ids.push(branch.id)
        queue.push(branch.id)
      }
    }
  }

  return ids
}

export function wouldCreateCycle(branchId: string, nextParentId: string | null, data: AppData) {
  if (!nextParentId) return false
  return getDescendantBranchIds(branchId, data).includes(nextParentId)
}
