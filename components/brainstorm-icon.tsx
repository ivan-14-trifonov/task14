import { Brain } from "lucide-react"
import { cn } from "@/lib/utils"

export function BrainstormIcon({ className }: { className?: string }) {
  return (
    <Brain
      className={cn("inline-block size-4 shrink-0 text-fuchsia-600", className)}
      aria-label="Мозговой штурм"
    />
  )
}
