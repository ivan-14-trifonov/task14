import Link from "next/link"
import { Folder, Pencil, Plus } from "lucide-react"
import { getDirectBranchCountTasks, getDirectBranchTaskCounts } from "@/lib/data/counts"
import { getChildren } from "@/lib/data/tree"
import { BranchCounts } from "@/components/branch-counts"
import { BranchForm } from "@/components/branch-form"
import { BranchSortableList } from "@/components/branch-sortable-list"
import { BranchTimingBadge } from "@/components/branch-timing-badge"
import { BranchTitle } from "@/components/branch-title"
import { BranchStatusDot } from "@/components/status-badge"
import { BranchTag } from "@/components/branch-tag"
import { Card } from "@/components/ui"
import { DialogButton } from "@/components/dialog-button"
import type { AppData, Branch } from "@/types"

export function BranchCard({ branch, data }: { branch: Branch; data: AppData }) {
  const children = getChildren(data, branch.id)
  const counts = getDirectBranchTaskCounts(branch.id, data)
  const countTasks = getDirectBranchCountTasks(branch.id, data)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/branches/${branch.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Folder className="size-4 text-blue-600" />
            <h2 className="truncate font-semibold">
              <BranchTitle branch={branch} />
            </h2>
            <BranchTag tag={branch.tag} />
            <BranchTimingBadge branch={branch} />
            <BranchStatusDot status={branch.status} />
          </div>
          <div className="mt-3">
            <BranchCounts
              inProgress={counts.inProgress}
              recurring={counts.recurring}
              onDemand={counts.onDemand}
              planned={counts.planned}
              tasks={countTasks}
            />
          </div>
        </Link>
        <div className="flex gap-1">
          <DialogButton
            title="Новая ветка"
            label={<Plus className="size-4" />}
            variant="ghost"
          >
            <BranchForm data={data} defaultParentId={branch.id} />
          </DialogButton>
          <DialogButton
            title="Редактировать ветку"
            label={<Pencil className="size-4" />}
            variant="ghost"
          >
            <BranchForm data={data} branch={branch} />
          </DialogButton>
        </div>
      </div>
      {children.length ? (
        <BranchSortableList ids={children.map((child) => child.id)} parentId={branch.id} className="mt-4 grid gap-2 border-l pl-4">
          {children.map((child) => (
            <BranchTreeNode key={child.id} branch={child} data={data} />
          ))}
        </BranchSortableList>
      ) : null}
    </Card>
  )
}

function BranchTreeNode({ branch, data }: { branch: Branch; data: AppData }) {
  const children = getChildren(data, branch.id)
  const counts = getDirectBranchTaskCounts(branch.id, data)
  const countTasks = getDirectBranchCountTasks(branch.id, data)

  return (
    <div className="grid gap-2">
      <Link href={`/branches/${branch.id}`} className="rounded-md px-2 py-2 hover:bg-muted">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BranchTitle branch={branch} />
          <BranchTag tag={branch.tag} />
          <BranchTimingBadge branch={branch} compact />
          <BranchStatusDot status={branch.status} />
        </div>
        <div className="mt-1">
          <BranchCounts
            inProgress={counts.inProgress}
            recurring={counts.recurring}
            onDemand={counts.onDemand}
            planned={counts.planned}
            tasks={countTasks}
            compact
          />
        </div>
      </Link>
      {children.length ? (
        <BranchSortableList ids={children.map((child) => child.id)} parentId={branch.id} className="ml-3 grid gap-2 border-l pl-3">
          {children.map((child) => (
            <BranchTreeNode key={child.id} branch={child} data={data} />
          ))}
        </BranchSortableList>
      ) : null}
    </div>
  )
}
