import { AppShell } from "@/components/app-shell"
import { TaskFilters } from "@/components/task-filters"
import { TaskList } from "@/components/task-list"
import { requireAdmin } from "@/lib/auth"
import { getDataForPage, getFilteredTasks } from "@/lib/data/queries"

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; branchId?: string }>
}) {
  const session = await requireAdmin()
  const params = await searchParams
  const data = await getDataForPage()
  const tasks = getFilteredTasks(data, {
    query: params.q,
    status: "done",
    branchId: params.branchId ?? "all",
    includeDescendants: true,
  })

  return (
    <AppShell session={session}>
      <section className="grid gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Архив</h1>
          <p className="text-sm text-muted-foreground">Выполненные задачи можно восстановить или удалить окончательно.</p>
        </div>
        <TaskFilters data={data} defaults={params} archive />
        <TaskList data={data} tasks={tasks} archive />
      </section>
    </AppShell>
  )
}
