import { cn } from "@/lib/utils"

export function BranchCounts({
  inProgress,
  recurring,
  planned,
  compact = false,
}: {
  inProgress: number
  recurring: number
  planned: number
  compact?: boolean
}) {
  if (inProgress === 0 && recurring === 0 && planned === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-1", compact && "mt-0.5")}>
      {inProgress ? (
        <span
          className="inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-4 text-white"
          title="В работе"
        >
          {inProgress}
        </span>
      ) : null}
      {recurring ? (
        <span
          className="inline-flex box-border min-w-4 items-center justify-center rounded-full border border-blue-600 bg-transparent px-[3px] text-[10px] font-bold leading-[14px] text-blue-700"
          title="Повторяющиеся задачи"
        >
          {recurring}
        </span>
      ) : null}
      {planned ? (
        <span
          className="inline-flex min-w-4 items-center justify-center rounded-full bg-slate-200 px-1 text-[10px] font-bold leading-4 text-slate-600"
          title="В плане"
        >
          {planned}
        </span>
      ) : null}
    </div>
  )
}
