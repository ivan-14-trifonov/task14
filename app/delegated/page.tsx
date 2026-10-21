import { AppShell } from "@/components/app-shell"
import { DelegatedTree } from "@/components/delegated-tree"
import { requireAdmin } from "@/lib/auth"
import { getDataForPage } from "@/lib/data/queries"

export default async function DelegatedPage() {
  const session = await requireAdmin()
  const data = await getDataForPage()

  return (
    <AppShell session={session}>
      <section className="grid gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Делегированные задачи</h1>
          <p className="text-sm text-muted-foreground">Только направления, в которых есть делегированные задачи.</p>
        </div>
        <DelegatedTree data={data} />
      </section>
    </AppShell>
  )
}
