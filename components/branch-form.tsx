import { Save } from "lucide-react"
import { createBranchAction, updateBranchAction } from "@/lib/data/actions"
import { getTodayKey } from "@/lib/data/daily"
import { AutoCloseForm } from "@/components/auto-close-form"
import { BranchLevelSelect } from "@/components/branch-level-select"
import { BranchStatusFields } from "@/components/branch-status-fields"
import { Button, Input, Label, Textarea } from "@/components/ui"
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
  const action = branch ? updateBranchAction : createBranchAction
  const timingStartDate = branch?.timing?.startDate ?? getTodayKey()
  const timingDailyMinutes = branch?.timing?.dailyMinutes ?? 30

  return (
    <AutoCloseForm action={action} className="grid gap-4">
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
        Регламент
        <Textarea
          name="regulation"
          defaultValue={branch?.regulation ?? ""}
          placeholder="Правила, порядок работы, критерии или заметки по направлению"
        />
      </Label>
      <BranchLevelSelect
        data={data}
        name="parentId"
        label="Родительская ветка"
        defaultValue={branch?.parentId ?? defaultParentId ?? ""}
        emptyValue=""
        emptyLabel="Корневое направление"
        excludeBranchId={branch?.id}
      />
      <BranchStatusFields defaultStatus={branch?.status ?? null} timingStartDate={timingStartDate} timingDailyMinutes={timingDailyMinutes} />
      <Button type="submit">
        <Save className="size-4" />
        Сохранить
      </Button>
    </AutoCloseForm>
  )
}
