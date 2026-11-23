import { Sprout } from "lucide-react"
import { habitStatusLabels } from "@/lib/data/habits"
import type { Habit } from "@/types"

export function HabitCount({ count }: { count: number }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 text-[10px] font-bold leading-4 text-emerald-800 ring-1 ring-emerald-200"
      title={`Привычки: ${count}`}
    >
      <Sprout className="size-3" aria-hidden="true" />
      <span className="sr-only">Привычки: </span>
      {count}
    </span>
  )
}

export function HabitPreview({ habits }: { habits: Habit[] }) {
  if (!habits.length) return null

  return (
    <div className="space-y-1">
      <p className="font-semibold text-foreground">Привычки</p>
      <ul className="space-y-1 text-muted-foreground">
        {habits.map((habit) => (
          <li key={habit.id} className="flex gap-2">
            <Sprout className="mt-0.5 size-3 shrink-0 text-emerald-700" aria-hidden="true" />
            <div className="min-w-0 break-words">
              <span className="text-foreground">{habit.title}</span>
              <span> · {habitStatusLabels[habit.status]}</span>
              {habit.comment ? <p className="whitespace-pre-wrap">{habit.comment}</p> : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
