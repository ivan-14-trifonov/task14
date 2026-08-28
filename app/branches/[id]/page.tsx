import Link from "next/link"
import { notFound } from "next/navigation"
import { Pause, Pencil, Play, Plus } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BranchCounts } from "@/components/branch-counts"
import { BranchForm } from "@/components/branch-form"
import { BranchTag } from "@/components/branch-tag"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTimingForm } from "@/components/branch-timing-form"
import { BranchTitle } from "@/components/branch-title"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DialogButton } from "@/components/dialog-button"
import { BranchStatusDot } from "@/components/status-badge"
import { TaskForm } from "@/components/task-form"
import { TaskList } from "@/components/task-list"
import { Card, LinkButton } from "@/components/ui"
import { requireAdmin } from "@/lib/auth"
import { deleteBranchAction, pauseBranchAction, resumeBranchAction } from "@/lib/data/actions"
import { getBranchTaskCounts } from "@/lib/data/counts"
import { getTaskDailyState } from "@/lib/data/daily"
import { getDataForPage, getFilteredTasks } from "@/lib/data/queries"
import { getBranchPath, getChildren } from "@/lib/data/tree"
import type { AppData, Task } from "@/types"

function TaskGroup({
  data,
  title,
  currentTasks,
  nestedTasks,
}: {
  data: AppData
  title: string
  currentTasks: Task[]
  nestedTasks: Task[]
}) {
  return (
    <div className="grid gap-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Задачи этой ветки</h3>
        <TaskList data={data} tasks={currentTasks} />
      </div>
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold text-muted-foreground">Задачи вложенных веток</h3>
        <TaskList data={data} tasks={nestedTasks} />
      </div>
    </div>
  )
}

function ArchiveGroup({
  data,
  title,
  tasks,
}: {
  data: AppData
  title: string
  tasks: Task[]
}) {
  return (
    <div className="grid gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <TaskList data={data} tasks={tasks} archive />
    </div>
  )
}

export default async function BranchPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const session = await requireAdmin()
  const { id } = await params
  const query = await searchParams
  const data = await getDataForPage()
  const branch = data.branches[id]
  if (!branch) notFound()

  const children = getChildren(data, id)
  const branchCounts = getBranchTaskCounts(id, data)
  const tasks = getFilteredTasks(data, { status: "all", branchId: id, includeDescendants: false }).filter(
    (task) => task.status !== "done",
  )
  const nestedTasks = getFilteredTasks(data, { status: "all", branchId: id, includeDescendants: true }).filter(
    (task) => task.status !== "done" && task.branchId !== id,
  )
  const archivedTasks = getFilteredTasks(data, { status: "done", branchId: id, includeDescendants: false })
  const nestedArchivedTasks = getFilteredTasks(data, { status: "done", branchId: id, includeDescendants: true }).filter(
    (task) => task.branchId !== id,
  )
  const isDoNowTask = (task: Task) =>
    task.status === "recurring" || (task.status === "in_progress" && getTaskDailyState(task) !== "closed")
  const currentDoNowTasks = tasks.filter(isDoNowTask)
  const nestedDoNowTasks = nestedTasks.filter(isDoNowTask)
  const currentOtherTasks = tasks.filter((task) => !isDoNowTask(task))
  const nestedOtherTasks = nestedTasks.filter((task) => !isDoNowTask(task))
  const path = getBranchPath(id, data)

  return (
    <AppShell session={session}>
      <section className="grid gap-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <Link href="/" className="rounded-sm hover:text-foreground hover:underline">
                Дерево
              </Link>
              {path.map((item) => (
                <span key={item.id} className="flex items-center gap-1">
                  <span>/</span>
                  <Link
                    href={`/branches/${item.id}`}
                    className="flex items-center gap-1 rounded-sm hover:text-foreground hover:underline"
                  >
                    <BranchTitle branch={item} />
                  </Link>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">
                <BranchTitle branch={branch} />
              </h1>
              <BranchTag tag={branch.tag} />
              <BranchTimingBadge branch={branch} />
              <BranchStatusDot status={branch.status} />
            </div>
            <div className="mt-3">
              <BranchCounts inProgress={branchCounts.inProgress} recurring={branchCounts.recurring} planned={branchCounts.planned} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <DialogButton
              title="Новая подветка"
              label={
                <>
                  <Plus className="size-4" />
                  Подветка
                </>
              }
            >
              <BranchForm data={data} defaultParentId={id} />
            </DialogButton>
            <DialogButton
              title="Новая задача"
              variant="primary"
              label={
                <>
                  <Plus className="size-4" />
                  Задача
                </>
              }
            >
              <TaskForm data={data} defaultBranchId={id} />
            </DialogButton>
            <DialogButton
              title="Редактировать ветку"
              label={
                <>
                  <Pencil className="size-4" />
                  Изменить
                </>
              }
              variant="ghost"
            >
              <BranchForm data={data} branch={branch} />
            </DialogButton>
            <form action={branch.status === "paused" ? resumeBranchAction : pauseBranchAction}>
              <input type="hidden" name="id" value={id} />
              <button
                type="submit"
                className="inline-flex h-9 items-center justify-center gap-2 rounded-md border bg-white px-3 text-sm font-medium transition hover:bg-muted"
              >
                {branch.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
                {branch.status === "paused" ? "Снять паузу" : "Пауза"}
              </button>
            </form>
            <ConfirmDialog
              id={id}
              action={deleteBranchAction}
              title="Подтвердить удаление"
              text="Пустая ветка будет удалена. Если в ней есть задачи или подветки, операция будет остановлена."
            />
          </div>
        </div>

        {query.error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{query.error}</div>
        ) : null}

        <BranchTimingForm branch={branch} />

        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">Подветки</h2>
          {children.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {children.map((child) => {
                const childCounts = getBranchTaskCounts(child.id, data)
                return (
                  <Card key={child.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <BranchStatusDot status={child.status} />
                          <BranchTitle branch={child} />
                          <BranchTag tag={child.tag} />
                          <BranchTimingBadge branch={child} compact />
                        </div>
                        <div className="mt-2">
                          <BranchCounts inProgress={childCounts.inProgress} recurring={childCounts.recurring} planned={childCounts.planned} />
                        </div>
                      </div>
                      <LinkButton href={`/branches/${child.id}`} variant="ghost">
                        Открыть
                      </LinkButton>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-4 text-sm text-muted-foreground">Подветок пока нет.</Card>
          )}
        </div>

        <TaskGroup
          data={data}
          title="Делать сейчас"
          currentTasks={currentDoNowTasks}
          nestedTasks={nestedDoNowTasks}
        />

        <TaskGroup
          data={data}
          title="Остальные задачи"
          currentTasks={currentOtherTasks}
          nestedTasks={nestedOtherTasks}
        />

        <ArchiveGroup data={data} title="Архив этой ветки" tasks={archivedTasks} />

        <ArchiveGroup data={data} title="Архив вложенных веток" tasks={nestedArchivedTasks} />
      </section>
    </AppShell>
  )
}
