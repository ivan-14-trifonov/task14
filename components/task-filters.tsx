import { Search } from "lucide-react"
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
  const branches = Object.values(data.branches).sort((a, b) => a.title.localeCompare(b.title, "ru"))

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
          </Select>
        </Label>
      ) : null}
      <Label>
        Ветка
        <Select name="branchId" defaultValue={defaults.branchId ?? "all"}>
          <option value="all">Все ветки</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.title}
            </option>
          ))}
        </Select>
      </Label>
      <div className="flex items-end">
        <Button type="submit" variant="secondary" className="w-full">
          <Search className="size-4" />
          Найти
        </Button>
      </div>
    </form>
  )
}
