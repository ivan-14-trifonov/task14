import { AppShell } from "@/components/app-shell"
import { TreeOverview } from "@/components/tree-overview"
import { requireAdmin } from "@/lib/auth"
import { getDataForPage } from "@/lib/data/queries"

export default async function HomePage() {
  const session = await requireAdmin()
  const data = await getDataForPage()

  return (
    <AppShell session={session}>
      <TreeOverview data={data} />
    </AppShell>
  )
}
