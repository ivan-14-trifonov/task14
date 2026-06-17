import { cn } from "@/lib/utils"
import type { Branch } from "@/types"

export function BranchTitle({
  branch,
  className,
}: {
  branch: Pick<Branch, "title" | "status">
  className?: string
}) {
  return <span className={cn(branch.status === "paused" && "text-muted-foreground line-through", className)}>{branch.title}</span>
}
