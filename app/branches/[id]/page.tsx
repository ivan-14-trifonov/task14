import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil, Plus } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { BranchCounts } from "@/components/branch-counts"
import { BranchForm } from "@/components/branch-form"
import { BranchTag } from "@/components/branch-tag"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTimingForm } from "@/components/branch-timing-form"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { DialogButton } from "@/components/dialog-button"
import { BranchStatusDot } from "@/components/status-badge"
import { TaskForm } from "@/components/task-form"
import { TaskList } from "@/components/task-list"
import { Card, LinkButton } from "@/components/ui"
import { requireAdmin } from "@/lib/auth"
import { deleteBranchAction } from "@/lib/data/actions"
import { getBranchTaskCounts } from "@/lib/data/counts"
import { getDataForPage, getFilteredTasks } from "@/lib/data/queries"
import { getBranchPath, getChildren } from "@/lib/data/tree"

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
                    {item.title}
                  </Link>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{branch.title}</h1>
              <BranchTag tag={branch.tag} />
              <BranchTimingBadge branch={branch} />
              <BranchStatusDot status={branch.status} />
            </div>
            <div className="mt-3">
              <BranchCounts inProgress={branchCounts.inProgress} planned={branchCounts.planned} />
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
                          {child.title}
                          <BranchTag tag={child.tag} />
                          <BranchTimingBadge branch={child} compact />
                        </div>
                        <div className="mt-2">
                          <BranchCounts inProgress={childCounts.inProgress} planned={childCounts.planned} />
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

        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">Задачи этой ветки</h2>
          <TaskList data={data} tasks={tasks} />
        </div>

        {nestedTasks.length ? (
          <div className="grid gap-3">
            <h2 className="text-lg font-semibold">Задачи вложенных веток</h2>
            <TaskList data={data} tasks={nestedTasks} />
          </div>
        ) : null}

        <div className="grid gap-3">
          <h2 className="text-lg font-semibold">Архив этой ветки</h2>
          <TaskList data={data} tasks={archivedTasks} archive />
        </div>

        {nestedArchivedTasks.length ? (
          <div className="grid gap-3">
            <h2 className="text-lg font-semibold">Архив вложенных веток</h2>
            <TaskList data={data} tasks={nestedArchivedTasks} archive />
          </div>
        ) : null}
      </section>
    </AppShell>
  )
}
