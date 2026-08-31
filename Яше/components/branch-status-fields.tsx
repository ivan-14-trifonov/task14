"use client"

import { useState } from "react"
import { Input, Label, Select } from "@/components/ui"
import type { BranchStatus } from "@/types"

export function BranchStatusFields({
  defaultStatus,
  timingStartDate,
  timingDailyMinutes,
}: {
  defaultStatus: BranchStatus
  timingStartDate: string
  timingDailyMinutes: number
}) {
  const [status, setStatus] = useState<BranchStatus>(defaultStatus)

  return (
    <>
      <Label>
        Статус
        <Select name="status" defaultValue={defaultStatus ?? ""} onChange={(event) => setStatus((event.target.value || null) as BranchStatus)}>
          <option value="">Без статуса</option>
          <option value="in_progress">В работе</option>
          <option value="paused">На паузе</option>
          <option value="timing">Тайминг</option>
        </Select>
      </Label>
      {status === "timing" ? (
        <div className="grid gap-3 rounded-md border bg-slate-50 p-3">
          <p className="text-sm font-medium">Настройки тайминга</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Label>
              Дата старта
              <Input name="timingStartDate" type="date" defaultValue={timingStartDate} />
            </Label>
            <Label>
              Минут в день
              <Input name="timingDailyMinutes" type="number" min={1} step={1} defaultValue={timingDailyMinutes} />
            </Label>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="timingStartDate" value={timingStartDate} />
          <input type="hidden" name="timingDailyMinutes" value={timingDailyMinutes} />
        </>
      )}
    </>
  )
}
