import { Plus } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { DialogButton } from "@/components/dialog-button"
import { TaskFilters } from "@/components/task-filters"
import { TaskForm } from "@/components/task-form"
import { TaskList } from "@/components/task-list"
import { requireAdmin } from "@/lib/auth"
import { getDataForPage, getFilteredTasks } from "@/lib/data/queries"

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; branchId?: string }>
}) {
  const session = await requireAdmin()
  const params = await searchParams
  const data = await getDataForPage()
  const status =
    params.status === "in_progress" || params.status === "planned" || params.status === "recurring"
      ? params.status
      : "all"
  const tasks = getFilteredTasks(data, {
    query: params.q,
    status,
    branchId: params.branchId ?? "all",
    includeDescendants: true,
  }).filter((task) => task.status !== "done")

  return (
    <AppShell session={session}>
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Все задачи</h1>
            <p className="text-sm text-muted-foreground">Активные задачи, отсортированные по дате обновления.</p>
          </div>
          <DialogButton
            title="Новая задача"
            variant="primary"
            label={
              <>
                <Plus className="size-4" />
                Новая задача
              </>
            }
          >
            <TaskForm data={data} />
          </DialogButton>
        </div>
        <TaskFilters data={data} defaults={params} />
        <TaskList data={data} tasks={tasks} />
      </section>
    </AppShell>
  )
}
