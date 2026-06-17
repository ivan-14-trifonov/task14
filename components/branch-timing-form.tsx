import { TimerReset } from "lucide-react"
import { setBranchTimingMinutesAction } from "@/lib/data/actions"
import { getBranchTimingStats } from "@/lib/data/timing"
import { Button, Card, Input, Label } from "@/components/ui"
import type { Branch } from "@/types"

export function BranchTimingForm({ branch }: { branch: Branch }) {
  const stats = getBranchTimingStats(branch)
  if (!stats) return null

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Тайминг</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Норма: {stats.dailyMinutes} мин/день · среднее: {Math.round(stats.averageMinutes)} мин · выполнение: {stats.percent}%
          </p>
        </div>
        <form action={setBranchTimingMinutesAction} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={branch.id} />
          <Label className="w-36">
            Сегодня, минут
            <Input name="minutes" type="number" min={0} step={1} defaultValue={stats.todayMinutes} />
          </Label>
          <Button type="submit" variant="secondary">
            <TimerReset className="size-4" />
            Записать
          </Button>
        </form>
      </div>
    </Card>
  )
}
