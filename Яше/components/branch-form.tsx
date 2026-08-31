import { Save } from "lucide-react"
import { createBranchAction, updateBranchAction } from "@/lib/data/actions"
import { getTodayKey } from "@/lib/data/daily"
import { BranchStatusFields } from "@/components/branch-status-fields"
import { Button, Input, Label, Select } from "@/components/ui"
import type { AppData, Branch } from "@/types"

export function BranchForm({
  data,
  branch,
  defaultParentId,
  openAfterCreate = false,
}: {
  data: AppData
  branch?: Branch
  defaultParentId?: string | null
  openAfterCreate?: boolean
}) {
  const branches = Object.values(data.branches)
    .filter((item) => item.id !== branch?.id)
    .sort((a, b) => a.title.localeCompare(b.title, "ru"))
  const action = branch ? updateBranchAction : createBranchAction
  const timingStartDate = branch?.timing?.startDate ?? getTodayKey()
  const timingDailyMinutes = branch?.timing?.dailyMinutes ?? 30

  return (
    <form action={action} className="grid gap-4">
      {branch ? <input type="hidden" name="id" value={branch.id} /> : null}
      <input type="hidden" name="openAfterCreate" value={String(openAfterCreate)} />
      <Label>
        Название
        <Input name="title" required defaultValue={branch?.title ?? ""} />
      </Label>
      <Label>
        Короткий тег
        <Input name="tag" maxLength={24} defaultValue={branch?.tag ?? ""} placeholder="Например: MVP" />
      </Label>
      <Label>
        Родительская ветка
        <Select name="parentId" defaultValue={branch?.parentId ?? defaultParentId ?? ""}>
          <option value="">Корневое направление</option>
          {branches.map((item) => (
            <option key={item.id} value={item.id}>
              {item.title}
            </option>
          ))}
        </Select>
      </Label>
      <BranchStatusFields defaultStatus={branch?.status ?? null} timingStartDate={timingStartDate} timingDailyMinutes={timingDailyMinutes} />
      <Button type="submit">
        <Save className="size-4" />
        Сохранить
      </Button>
    </form>
  )
}
