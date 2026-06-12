import { Plus } from "lucide-react"
import { getChildren } from "@/lib/data/tree"
import { BranchCard } from "@/components/branch-card"
import { BranchForm } from "@/components/branch-form"
import { DialogButton } from "@/components/dialog-button"
import { Card } from "@/components/ui"
import type { AppData } from "@/types"

export function TreeOverview({ data }: { data: AppData }) {
  const roots = getChildren(data, null)

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Дерево</h1>
          <p className="text-sm text-muted-foreground">Все направления со всей вложенностью.</p>
        </div>
        <DialogButton
          title="Новая ветка"
          variant="primary"
          label={
            <>
              <Plus className="size-4" />
              Новая ветка
            </>
          }
        >
          <BranchForm data={data} defaultParentId={null} />
        </DialogButton>
      </div>
      {roots.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {roots.map((branch) => (
            <BranchCard key={branch.id} branch={branch} data={data} />
          ))}
        </div>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">Дерево пустое. Создайте первое направление.</Card>
      )}
    </section>
  )
}
