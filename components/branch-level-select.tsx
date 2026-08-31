"use client"

import { useMemo, useState } from "react"
import { Label, Select } from "@/components/ui"
import type { AppData, Branch } from "@/types"

type BranchLevelSelectProps = {
  data: AppData
  name: string
  label: string
  defaultValue?: string | null
  emptyValue?: string
  emptyLabel?: string
  excludeBranchId?: string
}

function getBranchPathIds(branchId: string | null | undefined, branches: Record<string, Branch>) {
  if (!branchId || !branches[branchId]) return []

  const path: string[] = []
  let current: Branch | undefined = branches[branchId]

  while (current) {
    path.unshift(current.id)
    current = current.parentId ? branches[current.parentId] : undefined
  }

  return path
}

function isBranchExcluded(branch: Branch, branches: Record<string, Branch>, excludeBranchId?: string) {
  if (!excludeBranchId) return false
  let current: Branch | undefined = branch

  while (current) {
    if (current.id === excludeBranchId) return true
    current = current.parentId ? branches[current.parentId] : undefined
  }

  return false
}

function getChildren(parentId: string | null, branches: Record<string, Branch>, excludeBranchId?: string) {
  return Object.values(branches)
    .filter((branch) => branch.parentId === parentId && !isBranchExcluded(branch, branches, excludeBranchId))
    .sort((a, b) => a.sort - b.sort || a.title.localeCompare(b.title, "ru"))
}

export function BranchLevelSelect({
  data,
  name,
  label,
  defaultValue,
  emptyValue = "",
  emptyLabel,
  excludeBranchId,
}: BranchLevelSelectProps) {
  const initialPath = useMemo(() => {
    const path = getBranchPathIds(defaultValue, data.branches)
    return path.filter((id) => {
      const branch = data.branches[id]
      return branch && !isBranchExcluded(branch, data.branches, excludeBranchId)
    })
  }, [data.branches, defaultValue, excludeBranchId])
  const [path, setPath] = useState(initialPath)
  const selectedValue = path.at(-1) ?? emptyValue
  const levelParents: Array<string | null> = [null, ...path]

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={selectedValue} />
      <p className="text-sm font-medium">{label}</p>
      {emptyLabel ? (
        <button
          type="button"
          className="w-fit rounded-md border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
          onClick={() => setPath([])}
        >
          {emptyLabel}
        </button>
      ) : null}
      <div className="grid gap-2">
        {levelParents.map((parentId, level) => {
          const options = getChildren(parentId, data.branches, excludeBranchId)
          const value = path[level] ?? ""
          if (!options.length) return null

          return (
            <Label key={`${parentId ?? "root"}-${level}`}>
              Уровень {level + 1}
              <Select
                value={value}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setPath(nextValue ? [...path.slice(0, level), nextValue] : path.slice(0, level))
                }}
              >
                <option value="">Не выбрано</option>
                {options.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.title}
                  </option>
                ))}
              </Select>
            </Label>
          )
        })}
      </div>
    </div>
  )
}
