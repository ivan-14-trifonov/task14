import { nanoid } from "nanoid"
import { branchInputSchema, taskDailyStatusSchema, taskInputSchema, taskStatusSchema } from "@/lib/data/schema"
import { getTodayKey } from "@/lib/data/daily"
import { readData, writeData } from "@/lib/data/storage"
import { wouldCreateCycle } from "@/lib/data/tree"
import type { AppData, Branch, Task } from "@/types"

function nextSort(items: Array<{ sort: number }>) {
  return items.length ? Math.max(...items.map((item) => item.sort)) + 1 : 0
}

export async function createTask(input: unknown) {
  const values = taskInputSchema.parse(input)
  const data = await readData()
  if (!data.branches[values.branchId]) throw new Error("Выбранная ветка не найдена")
  const now = new Date().toISOString()
  const task: Task = {
    id: nanoid(),
    ...values,
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
  if (!data.branches[values.branchId]) throw new Error("Выбранная ветка не найдена")
  const now = new Date().toISOString()
  const task: Task = {
    ...existing,
    ...values,
    updatedAt: now,
    completedAt: values.status === "done" ? existing.completedAt ?? now : null,
    dailyStatus: values.status === "in_progress" ? existing.dailyStatus : null,
  }
  return writeData({ ...data, tasks: { ...data.tasks, [id]: task } })
}

export async function changeTaskStatus(id: string, status: unknown) {
  const nextStatus = taskStatusSchema.parse(status)
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
    updatedAt: new Date().toISOString(),
  }
  return writeData({ ...data, branches: { ...data.branches, [id]: branch } })
}

export async function deleteBranch(id: string) {
  const data = await readData()
  if (!data.branches[id]) throw new Error("Ветка не найдена")
  const hasChildren = Object.values(data.branches).some((branch) => branch.parentId === id)
  const hasTasks = Object.values(data.tasks).some((task) => task.branchId === id)
  if (hasChildren || hasTasks) {
    throw new Error("Нельзя удалить ветку, пока в ней есть задачи или подветки")
  }
  const branches = { ...data.branches }
  delete branches[id]
  return writeData({ ...data, branches })
}

export async function ensureStarterBranch(data: AppData) {
  if (Object.keys(data.branches).length) return data
  return createBranch({ title: "Первое направление", parentId: null, status: null })
}
