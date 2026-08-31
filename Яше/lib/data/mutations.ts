import { nanoid } from "nanoid"
import { branchInputSchema, taskDailyStatusSchema, taskInputSchema, taskStatusSchema } from "@/lib/data/schema"
import { getTodayKey } from "@/lib/data/daily"
import { readData, writeData } from "@/lib/data/storage"
import { getDescendantBranchIds, wouldCreateCycle } from "@/lib/data/tree"
import type { AppData, Branch, Task } from "@/types"

function nextSort(items: Array<{ sort: number }>) {
  return items.length ? Math.max(...items.map((item) => item.sort)) + 1 : 0
}

function applyBranchPauseToTasks(data: AppData, branchId: string, paused: boolean) {
  const branchIds = new Set(getDescendantBranchIds(branchId, data))
  const now = new Date().toISOString()
  const tasks = { ...data.tasks }

  for (const task of Object.values(tasks)) {
    if (!branchIds.has(task.branchId)) continue
    if (paused && task.status === "in_progress") {
      tasks[task.id] = { ...task, status: "paused", dailyStatus: null, updatedAt: now }
    }
    if (!paused && task.status === "paused") {
      tasks[task.id] = { ...task, status: "in_progress", updatedAt: now }
    }
  }

  return tasks
}

function isBranchPaused(data: AppData, branchId: string) {
  let current: Branch | undefined = data.branches[branchId]
  while (current) {
    if (current.status === "paused") return true
    current = current.parentId ? data.branches[current.parentId] : undefined
  }
  return false
}

export async function createTask(input: unknown) {
  const values = taskInputSchema.parse(input)
  if (values.status === "paused") throw new Error("Статус «На паузе» нельзя поставить вручную")
  const data = await readData()
  if (!data.branches[values.branchId]) throw new Error("Выбранная ветка не найдена")
  const now = new Date().toISOString()
  const status = values.status === "in_progress" && isBranchPaused(data, values.branchId) ? "paused" : values.status
  const task: Task = {
    id: nanoid(),
    ...values,
    status,
    sort: nextSort(Object.values(data.tasks).filter((item) => item.branchId === values.branchId)),
    createdAt: now,
    updatedAt: now,
    completedAt: values.status === "done" ? now : null,
    dailyStatus: null,
  }
  return writeData({ ...data, tasks: { ...data.tasks, [task.id]: task } })
}

export async function updateTask(id: string, input: unknown) {
  const values = taskInputSchema.parse(input)
  const data = await readData()
  const existing = data.tasks[id]
  if (!existing) throw new Error("Задача не найдена")
  if (values.status === "paused" && existing.status !== "paused") {
    throw new Error("Статус «На паузе» нельзя поставить вручную")
  }
  if (!data.branches[values.branchId]) throw new Error("Выбранная ветка не найдена")
  const now = new Date().toISOString()
  const status =
    values.status === "in_progress" && isBranchPaused(data, values.branchId)
      ? "paused"
      : values.status === "paused" && !isBranchPaused(data, values.branchId)
        ? "in_progress"
        : values.status
  const task: Task = {
    ...existing,
    ...values,
    status,
    updatedAt: now,
    completedAt: status === "done" ? existing.completedAt ?? now : null,
    dailyStatus: status === "in_progress" ? existing.dailyStatus : null,
  }
  return writeData({ ...data, tasks: { ...data.tasks, [id]: task } })
}

export async function changeTaskStatus(id: string, status: unknown) {
  const nextStatus = taskStatusSchema.parse(status)
  if (nextStatus === "paused") throw new Error("Статус «На паузе» нельзя поставить вручную")
  const data = await readData()
  const existing = data.tasks[id]
  if (!existing) throw new Error("Задача не найдена")
  const now = new Date().toISOString()
  const task: Task = {
    ...existing,
    status: nextStatus,
    updatedAt: now,
    completedAt: nextStatus === "done" ? existing.completedAt ?? now : null,
    dailyStatus: nextStatus === "in_progress" ? existing.dailyStatus : null,
  }
  return writeData({ ...data, tasks: { ...data.tasks, [id]: task } })
}

export async function changeTaskDailyStatus(id: string, status: unknown) {
  const dailyStatus = taskDailyStatusSchema.parse(status)
  const data = await readData()
  const existing = data.tasks[id]
  if (!existing) throw new Error("Задача не найдена")
  if (existing.status !== "in_progress") throw new Error("Ежедневная отметка доступна только для задач в работе")
  const now = new Date().toISOString()
  const task: Task = {
    ...existing,
    dailyStatus: {
      date: getTodayKey(),
      status: dailyStatus,
    },
    updatedAt: now,
  }
  return writeData({ ...data, tasks: { ...data.tasks, [id]: task } })
}

export async function deleteTask(id: string) {
  const data = await readData()
  if (!data.tasks[id]) throw new Error("Задача не найдена")
  const tasks = { ...data.tasks }
  delete tasks[id]
  return writeData({ ...data, tasks })
}

export async function createBranch(input: unknown) {
  const values = branchInputSchema.parse(input)
  const data = await readData()
  if (values.parentId && !data.branches[values.parentId]) throw new Error("Родительская ветка не найдена")
  const now = new Date().toISOString()
  const branch: Branch = {
    id: nanoid(),
    ...values,
    timing: values.timing ? { ...values.timing, entries: {} } : null,
    sort: nextSort(Object.values(data.branches).filter((item) => item.parentId === values.parentId)),
    createdAt: now,
    updatedAt: now,
  }
  return writeData({ ...data, branches: { ...data.branches, [branch.id]: branch } })
}

export async function updateBranch(id: string, input: unknown) {
  const values = branchInputSchema.parse(input)
  const data = await readData()
  const existing = data.branches[id]
  if (!existing) throw new Error("Ветка не найдена")
  if (values.parentId && !data.branches[values.parentId]) throw new Error("Родительская ветка не найдена")
  if (values.parentId === id || wouldCreateCycle(id, values.parentId, data)) {
    throw new Error("Нельзя переместить ветку внутрь самой себя")
  }
  const branch: Branch = {
    ...existing,
    ...values,
    timing: values.timing
      ? {
          ...values.timing,
          entries: existing.timing?.entries ?? {},
        }
      : null,
    updatedAt: new Date().toISOString(),
  }
  const statusChangedToPause = existing.status !== "paused" && branch.status === "paused"
  const statusChangedFromPause = existing.status === "paused" && branch.status !== "paused"
  const tasks =
    statusChangedToPause || statusChangedFromPause
      ? applyBranchPauseToTasks(data, id, statusChangedToPause)
      : data.tasks

  return writeData({ ...data, branches: { ...data.branches, [id]: branch }, tasks })
}

export async function setBranchPaused(id: string, paused: boolean) {
  const data = await readData()
  const existing = data.branches[id]
  if (!existing) throw new Error("Ветка не найдена")
  const now = new Date().toISOString()
  const branch: Branch = {
    ...existing,
    status: paused ? "paused" : null,
    updatedAt: now,
  }
  const tasks = applyBranchPauseToTasks(data, id, paused)

  return writeData({ ...data, branches: { ...data.branches, [id]: branch }, tasks })
}

export async function deleteBranch(id: string) {
  const data = await readData()
  if (!data.branches[id]) throw new Error("Ветка не найдена")
  const childrenCount = Object.values(data.branches).filter((branch) => branch.parentId === id).length
  const branchTasks = Object.values(data.tasks).filter((task) => task.branchId === id)
  const activeTasksCount = branchTasks.filter((task) => task.status !== "done").length
  const archivedTasksCount = branchTasks.filter((task) => task.status === "done").length
  if (childrenCount || branchTasks.length) {
    const details = [
      childrenCount ? `подветки: ${childrenCount}` : null,
      activeTasksCount ? `активные задачи: ${activeTasksCount}` : null,
      archivedTasksCount ? `задачи в архиве: ${archivedTasksCount}` : null,
    ]
      .filter(Boolean)
      .join(", ")
    throw new Error(`Нельзя удалить ветку, пока в ней есть задачи или подветки${details ? ` (${details})` : ""}`)
  }
  const branches = { ...data.branches }
  delete branches[id]
  return writeData({ ...data, branches })
}

export async function reorderBranches(parentId: string | null, orderedIds: unknown) {
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    throw new Error("Некорректный порядок веток")
  }
  const data = await readData()
  const siblings = Object.values(data.branches).filter((branch) => branch.parentId === parentId)
  const siblingIds = siblings.map((branch) => branch.id).sort()
  const nextIds = [...orderedIds].sort()

  if (siblingIds.length !== nextIds.length || siblingIds.some((id, index) => id !== nextIds[index])) {
    throw new Error("Можно менять порядок только внутри одного уровня веток")
  }

  const branches = { ...data.branches }
  orderedIds.forEach((id, index) => {
    branches[id] = {
      ...branches[id],
      sort: index,
      updatedAt: new Date().toISOString(),
    }
  })

  return writeData({ ...data, branches })
}

export async function setBranchTimingMinutes(id: string, minutes: unknown) {
  const parsedMinutes = Number(minutes)
  if (!Number.isFinite(parsedMinutes) || parsedMinutes < 0) throw new Error("Укажите количество минут")
  const data = await readData()
  const existing = data.branches[id]
  if (!existing) throw new Error("Ветка не найдена")
  if (!existing.timing) throw new Error("Для ветки не настроен тайминг")
  const today = getTodayKey()
  const branch: Branch = {
    ...existing,
    timing: {
      ...existing.timing,
      entries: {
        ...existing.timing.entries,
        [today]: Math.round(parsedMinutes),
      },
    },
    updatedAt: new Date().toISOString(),
  }
  return writeData({ ...data, branches: { ...data.branches, [id]: branch } })
}

export async function ensureStarterBranch(data: AppData) {
  if (Object.keys(data.branches).length) return data
  return createBranch({ title: "Первое направление", parentId: null, status: null })
}
