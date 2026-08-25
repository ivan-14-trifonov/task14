import { Plus } from "lucide-react"
import Link from "next/link"
import { getChildren } from "@/lib/data/tree"
import { BranchCard } from "@/components/branch-card"
import { BranchForm } from "@/components/branch-form"
import { BranchSortModeButton, BranchSortModeProvider } from "@/components/branch-sort-mode"
import { BranchSortableList } from "@/components/branch-sortable-list"
import { DialogButton } from "@/components/dialog-button"
import { MindMap } from "@/components/mind-map"
import { Card } from "@/components/ui"
import { cn } from "@/lib/utils"
import type { AppData } from "@/types"

export function TreeOverview({ data, view = "tree" }: { data: AppData; view?: "tree" | "mind-map" }) {
  const roots = getChildren(data, null)
  const isMindMap = view === "mind-map"

  return (
    <BranchSortModeProvider>
      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{isMindMap ? "Ментальная карта" : "Дерево"}</h1>
            <p className="text-sm text-muted-foreground">
              {isMindMap ? "Визуальная карта всех направлений." : "Все направления со всей вложенностью."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex rounded-md border bg-white p-1">
              <Link
                href="/"
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                  !isMindMap && "bg-muted text-foreground",
                )}
              >
                Дерево
              </Link>
              <Link
                href="/?view=mind-map"
                className={cn(
                  "rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground",
                  isMindMap && "bg-muted text-foreground",
                )}
              >
                Ментальная карта
              </Link>
            </div>
            {isMindMap ? null : <BranchSortModeButton />}
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
        {isMindMap ? (
          <MindMap data={data} />
        ) : roots.length ? (
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
