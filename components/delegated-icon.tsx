import { UserRoundCheck } from "lucide-react"
import { cn } from "@/lib/utils"

export function DelegatedIcon({ className }: { className?: string }) {
  return (
    <UserRoundCheck
      className={cn("inline-block size-4 shrink-0 text-indigo-600", className)}
      aria-label="Делегировано"
    />
  )
}
