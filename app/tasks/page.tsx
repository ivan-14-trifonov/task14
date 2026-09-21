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
  const tasks = getFilteredTasks(data, {
    query: params.q,
    status: "calendar",
    branchId: params.branchId ?? "all",
    includeDescendants: true,
  }).sort((a, b) => (a.calendar?.at ?? "").localeCompare(b.calendar?.at ?? "") || a.sort - b.sort || a.title.localeCompare(b.title, "ru"))

  return (
    <AppShell session={session}>
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Календарь</h1>
            <p className="text-sm text-muted-foreground">Календарные задачи, самые ранние даты сверху.</p>
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
        <TaskFilters data={data} defaults={params} hideStatus />
        <TaskList data={data} tasks={tasks} emptyText="Календарных задач пока нет." />
      </section>
    </AppShell>
  )
}
