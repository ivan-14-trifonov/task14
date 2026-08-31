import { Search } from "lucide-react"
import { BranchLevelSelect } from "@/components/branch-level-select"
import { Button, Input, Label, Select } from "@/components/ui"
import type { AppData, TaskStatus } from "@/types"

export function TaskFilters({
  data,
  defaults,
  archive = false,
}: {
  data: AppData
  defaults: { q?: string; status?: string; branchId?: string }
  archive?: boolean
}) {
  return (
    <form className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-[1fr_180px_220px_auto]">
      <Label>
        Поиск
        <Input name="q" defaultValue={defaults.q ?? ""} placeholder="Название или описание" />
      </Label>
      {!archive ? (
        <Label>
          Статус
          <Select name="status" defaultValue={defaults.status ?? "all"}>
            <option value="all">Все активные</option>
            <option value={"in_progress" satisfies TaskStatus}>В работе</option>
            <option value={"planned" satisfies TaskStatus}>В плане</option>
            <option value={"recurring" satisfies TaskStatus}>Повторяющиеся</option>
            <option value={"on_demand" satisfies TaskStatus}>По требованию</option>
          </Select>
        </Label>
      ) : null}
      <BranchLevelSelect
        data={data}
        name="branchId"
        label="Ветка"
        defaultValue={defaults.branchId ?? "all"}
        emptyValue="all"
        emptyLabel="Все ветки"
      />
      <div className="flex items-end">
        <Button type="submit" variant="secondary" className="w-full">
          <Search className="size-4" />
          Найти
        </Button>
      </div>
    </form>
  )
}
