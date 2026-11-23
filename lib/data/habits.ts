import type { AppData, HabitStatus } from "@/types"

export const habitStatusLabels: Record<HabitStatus, string> = {
  planned: "В плане",
  in_progress: "В работе",
  formed: "Сформирована",
}

export function getBranchHabits(branchId: string, data: AppData) {
  return Object.values(data.habits).filter((habit) => habit.branchId === branchId)
}
