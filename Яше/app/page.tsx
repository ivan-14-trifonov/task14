import { AppShell } from "@/components/app-shell"
import { TreeOverview } from "@/components/tree-overview"
import { requireAdmin } from "@/lib/auth"
import { getDataForPage } from "@/lib/data/queries"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>
}) {
  const session = await requireAdmin()
  const query = await searchParams
  const data = await getDataForPage()
  const view = query.view === "mind-map" ? "mind-map" : "tree"

  return (
    <AppShell session={session}>
      <TreeOverview data={data} view={view} />
    </AppShell>
  )
}
