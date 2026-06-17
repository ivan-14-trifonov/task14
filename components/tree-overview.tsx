import { Plus } from "lucide-react"
import { getChildren } from "@/lib/data/tree"
import { BranchCard } from "@/components/branch-card"
import { BranchForm } from "@/components/branch-form"
import { BranchSortModeButton, BranchSortModeProvider } from "@/components/branch-sort-mode"
import { BranchSortableList } from "@/components/branch-sortable-list"
import { DialogButton } from "@/components/dialog-button"
import { Card } from "@/components/ui"
import type { AppData } from "@/types"

export function TreeOverview({ data }: { data: AppData }) {
  const roots = getChildren(data, null)

  return (
    <BranchSortModeProvider>
      <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Дерево</h1>
          <p className="text-sm text-muted-foreground">Все направления со всей вложенностью.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <BranchSortModeButton />
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
      </div>
      {roots.length ? (
        <BranchSortableList ids={roots.map((branch) => branch.id)} parentId={null} className="grid gap-4 md:grid-cols-2">
          {roots.map((branch) => (
            <BranchCard key={branch.id} branch={branch} data={data} />
          ))}
        </BranchSortableList>
      ) : (
        <Card className="p-6 text-sm text-muted-foreground">Дерево пустое. Создайте первое направление.</Card>
      )}
      </section>
    </BranchSortModeProvider>
  )
}
