"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { requireAdmin } from "@/lib/auth"
import * as mutations from "@/lib/data/mutations"

function getNullableString(formData: FormData, key: string) {
  const value = formData.get(key)
  if (typeof value !== "string" || value === "" || value === "null") return null
  return value
}

function getString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" ? value : ""
}

function taskInputFromForm(formData: FormData) {
  return {
    title: getString(formData, "title"),
    description: getString(formData, "description"),
    branchId: getString(formData, "branchId"),
    status: getString(formData, "status"),
  }
}

function branchInputFromForm(formData: FormData) {
  return {
    title: getString(formData, "title"),
    tag: getString(formData, "tag"),
    parentId: getNullableString(formData, "parentId"),
    status: getNullableString(formData, "status"),
    timingStartDate: getString(formData, "timingStartDate"),
    timingDailyMinutes: getString(formData, "timingDailyMinutes"),
  }
}

function refresh() {
  revalidatePath("/")
  revalidatePath("/tasks")
  revalidatePath("/branches", "page")
}

export async function createTaskAction(formData: FormData) {
  await requireAdmin()
  await mutations.createTask(taskInputFromForm(formData))
  refresh()
}

export async function updateTaskAction(formData: FormData) {
  await requireAdmin()
  await mutations.updateTask(getString(formData, "id"), taskInputFromForm(formData))
  refresh()
}

export async function deleteTaskAction(formData: FormData) {
  await requireAdmin()
  await mutations.deleteTask(getString(formData, "id"))
  refresh()
}

export async function completeTaskAction(formData: FormData) {
  await requireAdmin()
  await mutations.changeTaskStatus(getString(formData, "id"), "done")
  refresh()
}

export async function restoreTaskAction(formData: FormData) {
  await requireAdmin()
  await mutations.changeTaskStatus(getString(formData, "id"), "planned")
  refresh()
}

export async function markTaskWorkedTodayAction(formData: FormData) {
  await requireAdmin()
  await mutations.changeTaskDailyStatus(getString(formData, "id"), "worked")
  refresh()
}

export async function closeTaskForTodayAction(formData: FormData) {
  await requireAdmin()
  await mutations.changeTaskDailyStatus(getString(formData, "id"), "closed")
  refresh()
}

export async function createBranchAction(formData: FormData) {
  await requireAdmin()
  const data = await mutations.createBranch(branchInputFromForm(formData))
  refresh()
  const openAfterCreate = formData.get("openAfterCreate") === "true"
  if (openAfterCreate) {
    const created = Object.values(data.branches).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0]
    if (created) redirect(`/branches/${created.id}`)
  }
}

export async function updateBranchAction(formData: FormData) {
  await requireAdmin()
  await mutations.updateBranch(getString(formData, "id"), branchInputFromForm(formData))
  refresh()
}

export async function deleteBranchAction(formData: FormData) {
  await requireAdmin()
  const id = getString(formData, "id")
  try {
    await mutations.deleteBranch(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось удалить ветку"
    redirect(`/branches/${id}?error=${encodeURIComponent(message)}`)
  }
  refresh()
  redirect("/")
}

export async function setBranchTimingMinutesAction(formData: FormData) {
  await requireAdmin()
  await mutations.setBranchTimingMinutes(getString(formData, "id"), getString(formData, "minutes"))
  refresh()
}

export async function pauseBranchAction(formData: FormData) {
  await requireAdmin()
  await mutations.setBranchPaused(getString(formData, "id"), true)
  refresh()
}

export async function resumeBranchAction(formData: FormData) {
  await requireAdmin()
  await mutations.setBranchPaused(getString(formData, "id"), false)
  refresh()
}

export async function reorderBranchesAction(formData: FormData) {
  await requireAdmin()
  const parentId = getNullableString(formData, "parentId")
  const orderedIds = JSON.parse(getString(formData, "orderedIds"))
  await mutations.reorderBranches(parentId, orderedIds)
  refresh()
}
