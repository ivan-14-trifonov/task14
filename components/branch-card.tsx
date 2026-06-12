import Link from "next/link"
import { Folder, Pencil, Plus } from "lucide-react"
import { getBranchTaskCounts } from "@/lib/data/counts"
import { getChildren } from "@/lib/data/tree"
import { BranchForm } from "@/components/branch-form"
import { BranchStatusDot } from "@/components/status-badge"
import { Card } from "@/components/ui"
import { DialogButton } from "@/components/dialog-button"
import type { AppData, Branch } from "@/types"

export function BranchCard({ branch, data }: { branch: Branch; data: AppData }) {
  const children = getChildren(data, branch.id)
  const counts = getBranchTaskCounts(branch.id, data)

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/branches/${branch.id}`} className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Folder className="size-4 text-blue-600" />
            <h2 className="truncate font-semibold">{branch.title}</h2>
            <BranchStatusDot status={branch.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">В работе: {counts.inProgress}</span>
            <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-700">В плане: {counts.planned}</span>
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
        <div className="mt-4 grid gap-2 border-l pl-4">
          {children.map((child) => (
            <BranchTreeNode key={child.id} branch={child} data={data} />
          ))}
        </div>
      ) : null}
    </Card>
  )
}

function BranchTreeNode({ branch, data }: { branch: Branch; data: AppData }) {
  const children = getChildren(data, branch.id)
  const counts = getBranchTaskCounts(branch.id, data)

  return (
    <div className="grid gap-2">
      <Link href={`/branches/${branch.id}`} className="rounded-md px-2 py-2 hover:bg-muted">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span>{branch.title}</span>
          <BranchStatusDot status={branch.status} />
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          В работе: {counts.inProgress} · В плане: {counts.planned}
        </div>
      </Link>
      {children.length ? (
        <div className="ml-3 grid gap-2 border-l pl-3">
          {children.map((child) => (
            <BranchTreeNode key={child.id} branch={child} data={data} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
