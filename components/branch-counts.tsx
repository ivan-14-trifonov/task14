import { cn } from "@/lib/utils"

export function BranchCounts({
  inProgress,
  planned,
  compact = false,
}: {
  inProgress: number
  planned: number
  compact?: boolean
}) {
  const itemClass = compact ? "inline-flex items-center gap-1" : "inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1"

  return (
    <div className={cn("flex flex-wrap gap-2 text-xs text-muted-foreground", compact && "gap-x-1")}>
      <span className={itemClass}>
        <span>В работе:</span>
        <span className={cn(inProgress > 0 && "font-semibold text-red-600")}>{inProgress}</span>
      </span>
      {compact ? <span>·</span> : null}
      <span className={itemClass}>
        <span>В плане:</span>
        <span>{planned}</span>
      </span>
    </div>
  )
}
