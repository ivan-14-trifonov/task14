import { Clock3 } from "lucide-react"
import { getBranchTimingStats } from "@/lib/data/timing"
import type { Branch } from "@/types"

export function BranchTimingBadge({ branch, compact = false }: { branch: Branch; compact?: boolean }) {
  const stats = getBranchTimingStats(branch)
  if (!stats) return null

  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-800 ring-1 ring-cyan-200">
      <Clock3 className="size-3.5" />
      <span>{stats.dailyMinutes} мин/день</span>
      <span className={stats.percent >= 100 ? "text-emerald-700" : "text-cyan-900"}>{stats.percent}%</span>
      {!compact && stats.days ? <span className="font-normal text-cyan-700">за {stats.days} дн.</span> : null}
    </span>
  )
}
